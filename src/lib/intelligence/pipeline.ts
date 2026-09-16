// Orchestrates the full pipeline (spec section 2):
//   query understanding -> constraints -> relationships -> verification
//   -> hybrid retrieval -> eligibility -> ranking -> evidence -> LLM answer
//
// Product-pipeline stages (constraints/eligibility/ranking) only run for
// intents that need them (spec example 3: "do not recommend products
// unless appropriate").
import { supabaseAdmin } from '@/lib/supabase-admin'
import { understandQuery, isAllStatesRequest, isTotalProductsRequest, isShowMoreRequest } from './queryUnderstanding'
import { buildConstraints } from './constraints'
import { verifyGI } from './verification'
import { getAllGIProducts, findArtisanByName, findNewsMentioningPerson, findReviewMentioningPerson, getProductCountsByState, getAllArtisans, resolvePersonName, resolveGIProduct, sameCraftByTokens, matchesGIRegistry } from './relationships'
import type { PersonCandidate } from './relationships'
import { retrieveCandidateProducts, retrieveNarrativeEvidence, retrieveImageSearchMatches, warmUpChatbotBackend } from './retrieval'
import { filterEligible } from './eligibility'
import { rankProducts } from './ranking'
import { buildEvidence } from './evidence'
import { generateResponse } from './responseGenerator'
import { KALASTREE_EVIDENCE, WOMEN_ONLY_PLATFORM_EVIDENCE, GI_DEFINITION_EVIDENCE, ORDER_RELATED_EVIDENCE, isFounderName, findAboutStoryMention, FOUNDER_NAME, CO_FOUNDER_NAME } from './kalastreeInfo'
import { identifyProductImage } from './imageIdentification'
import { normalizeCraft } from './entityNormalization'
import { PRODUCT_INTENTS } from './types'
import type { CandidateProduct, DebugInfo, Evidence, RankedProduct, StructuredQuery, VerificationResult } from './types'

interface HistoryMessage {
  role: 'user' | 'ai'
  text: string
}

// Plain English filler words — universal grammar, not specific to this
// catalogue, so a fixed list here is safe at any scale (unlike the
// catalogue-specific "generic word" idea this file used to also maintain —
// see filterToDistinctiveTerms below for why that was replaced). Needed
// once search terms started being pulled from imageIdentification.
// visualDescription (a full sentence, e.g. "The image shows a stylized
// figurine of a deer with intricate detailing.") rather than just
// objectGuess's short 2-5 word phrase — without this, a websearch OR query
// like "the OR image OR shows OR..." would pull in noise words.
const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'this', 'that', 'it', 'its',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'or', 'shows', 'showing',
  'image', 'photo', 'picture', 'appears', 'looks', 'like', 'has', 'have',
])

// Which of a photo's candidate words actually carry search signal, decided
// from the REAL catalogue's own word frequencies — not a hand-maintained
// list of words assumed to be "generic" (decorative, white, detailing, ...).
// A fixed list like that was tried first and reproduced a real failure at
// even this catalogue's current tiny size: every time a new incidentally-
// common word slipped through (first "detailing", then "white"), it took
// another manual patch to fix — the exact same "impossible to keep a table
// of every word" problem already rejected for craft-name synonyms elsewhere
// in this pipeline (see relationships.ts's KNOWN_SYNONYMS doc comment), and
// it can only get worse as the catalogue grows toward hundreds of thousands
// or millions of real products, where no fixed list could ever keep up.
// Instead: a word that appears in a large fraction of the WHOLE catalogue
// carries little real signal about THIS specific photo, whatever the word
// happens to be — measured live, adapts automatically as the catalogue
// grows, and needs no maintenance. Each candidate word costs one indexed
// COUNT query (run in parallel), cheap at any catalogue size since
// search_vector already has a GIN index (see the fulltext-search migration).
async function filterToDistinctiveTerms(terms: string[]): Promise<string[]> {
  if (!terms.length) return []
  const { count: totalCount } = await supabaseAdmin
    .from('products').select('*', { count: 'exact', head: true })
    .eq('status', 'approved').gt('stock', 0)
  const total = totalCount ?? 0
  if (!total) return terms

  const MAX_COMMON_FRACTION = 0.15
  const withCounts = await Promise.all(
    terms.map(async term => {
      const { count } = await supabaseAdmin
        .from('products').select('*', { count: 'exact', head: true })
        .eq('status', 'approved').gt('stock', 0)
        .textSearch('search_vector', term, { type: 'websearch', config: 'english' })
      return { term, fraction: (count ?? 0) / total }
    })
  )
  return withCounts.filter(({ fraction }) => fraction <= MAX_COMMON_FRACTION).map(({ term }) => term)
}

export interface PipelineResult {
  answer: string
  sources: string[]
  products: ReturnType<typeof publicProduct>[]
  matchedConstraints: string[]
  structuredQuery: StructuredQuery
  // This turn's evidence, round-tripped by the client as `previousEvidence`
  // on the next request — lets a follow-up "where did you get that?" (see
  // source_inquiry below) answer from what was actually used, instead of a
  // fresh, unrelated retrieval that can't find it again.
  evidence: Evidence[]
  debug: DebugInfo | null
}

function publicProduct(r: import('./types').RankedProduct) {
  return {
    id: r.product.id,
    name: r.product.name,
    slug: r.product.slug,
    price: r.product.price,
    image: r.product.images?.[0] ?? null,
    state: r.product.state,
    giVerified: !!r.giVerification?.gi_verified,
    giTag: r.product.gi_tag,
    artisan: r.product.artisan ? { name: r.product.artisan.name, slug: r.product.artisan.slug } : null,
    craft: r.product.artisan?.craft ?? null,
    score: r.score,
    matchedConstraints: r.matchedConstraints,
    whyRecommended: r.ranking_reason,
  }
}

export async function runPipeline(
  question: string,
  history: HistoryMessage[],
  previousQuery: StructuredQuery | null,
  includeDebug: boolean,
  previousEvidence: Evidence[] | null = null,
  image: string | null = null
): Promise<PipelineResult> {
  const t0 = Date.now()
  // Fire-and-forget, before intents are known — see retrieval.ts for why.
  warmUpChatbotBackend()
  // hasImage tells query understanding an image is attached to THIS turn —
  // without it, that LLM call reasoned entirely blind to the photo's
  // existence, which is exactly how it fabricated entities.craft:
  // "Sundarban Honey" out of a "honey product" text history for an
  // unrelated horse-figurine photo (see understandQuery's own doc comment
  // for the full reproduced case). This is deliberately the raw `!!image`
  // (any attached photo, sticky-resent or fresh), not shouldProcessImage —
  // query understanding needs to know a photo EXISTS to reason correctly
  // about whether "this"/"it" refers to it; shouldProcessImage (computed
  // just below, from THIS call's own refersToUploadedPhoto output) is a
  // separate, later decision about whether to actually analyze it.
  const structuredQuery = await understandQuery(question, history, previousQuery, !!image)
  const t1 = Date.now()
  const needsProducts = structuredQuery.intents.some(i => PRODUCT_INTENTS.includes(i))
  // ChatWidget keeps resending the last uploaded photo on every later turn
  // until the user removes it (so a text-only correction/detail still has
  // something to refer to — see imageIdentification.ts's hintLine doc
  // comment). That means `image` can be non-null on a turn that has nothing
  // to do with it — only actually analyze it when structuredQuery judged
  // THIS message to be about it (see StructuredQuery.refersToUploadedPhoto's
  // doc comment for the reproduced bug: an unrelated question got its real
  // evidence silently overridden by a stale, irrelevant image re-match).
  const shouldProcessImage = !!image && structuredQuery.refersToUploadedPhoto

  const [verification, narrative, imageIdentification, imageSearchMatches] = await Promise.all([
    verifyGI(structuredQuery.entities),
    retrieveNarrativeEvidence(question, structuredQuery.intents),
    shouldProcessImage ? identifyProductImage(image!, question) : Promise.resolve(null),
    // Real visual similarity search, run in parallel with the vision craft
    // guess above so it costs no extra latency — see retrieval.ts's doc
    // comment for why this is a more accurate alternative to the
    // keyword-based object-fallback search below.
    shouldProcessImage ? retrieveImageSearchMatches(image!) : Promise.resolve([]),
  ])
  const t2 = Date.now()

  const constraints = needsProducts ? buildConstraints(structuredQuery) : []
  const candidates = needsProducts ? await retrieveCandidateProducts(structuredQuery.entities) : []
  const giProducts = needsProducts ? await getAllGIProducts() : []
  const t3 = Date.now()

  const eligible = needsProducts ? filterEligible(candidates, constraints, giProducts) : []
  let ranked = needsProducts ? rankProducts(eligible, structuredQuery.entities, constraints.length) : []

  // "Show more" only means something relative to what the user was just
  // shown — reproduced live: asking this after a truncated list (correctly
  // disclosed as "5 of 13") returned the SAME 5 products again, since
  // ranking is deterministic and nothing tracked what had already been
  // seen. previousEvidence is the client-held record of last turn's
  // evidence (see the source_inquiry usage below for the existing
  // precedent for reading it) — pull the product ids out of it and drop
  // them from this turn's ranked list before anything slices it, so
  // evidence/response-generation/the returned product cards all
  // consistently surface the NEXT batch instead of repeating the first one.
  if (isShowMoreRequest(question) && previousEvidence?.length) {
    const alreadyShownIds = new Set(
      previousEvidence
        .map(e => e.source_id.match(/^products:(.+)$/)?.[1])
        .filter((id): id is string => !!id)
    )
    if (alreadyShownIds.size) {
      ranked = ranked.filter(r => !alreadyShownIds.has(r.product.id))
    }
  }

  // A user-uploaded product photo: the vision guess (imageIdentification.
  // craftGuess) is NEVER stated as fact on its own — it is only ever used
  // as a search term against the REAL GI registry and marketplace, the
  // exact same way a typed craft name is. If the guess doesn't resolve to
  // anything real, this says so honestly rather than presenting an
  // unverified vision guess as a confirmed GI/state/marketplace fact.
  const evidenceFromImage: Evidence[] = []
  // Tracks verification for the IMAGE's own resolution specifically — kept
  // separate from the outer `verification` variable (computed earlier from
  // possibly-stale, carried-over TEXT entities, before the image was even
  // analyzed). Reproduced live: uploading a new, unrelated photo (a bronze
  // horse figurine) after a previous conversation about "Banarasi Silk"
  // correctly failed to match the new photo (evidenceFromImage's "no
  // match" branch fired), but the LATER evidence-rebuild below still used
  // the stale outer `verification` — which was carrying forward
  // "Banarasi Silk" from the PREVIOUS turn's now-irrelevant craft entity —
  // injecting an unrelated GI fact alongside "couldn't identify this
  // photo" and confusing the model into the generic fallback. A fresh
  // photo is a fresh subject: it must never inherit a GI fact left over
  // from whatever was discussed before it was uploaded.
  let imageVerification: VerificationResult | null = null
  if (imageIdentification) {
    const normalizedGuess = imageIdentification.craftGuess
      ? await normalizeCraft(imageIdentification.craftGuess)
      : null
    const matchedGI = normalizedGuess
      ? await resolveGIProduct({ craft: normalizedGuess, state: null } as never)
      : null

    if (matchedGI) {
      imageVerification = {
        entity: matchedGI.name,
        gi_verified: true,
        region: matchedGI.state,
        craft_category: matchedGI.category,
        source: `KalaStree verified GI registry (tag: ${matchedGI.gi_tag}, registered ${matchedGI.year})`,
        source_confidence: 'high',
        verification_status: 'verified',
        gi_product: matchedGI,
      }
      // Several gi_products rows have incomplete optional fields (district/
      // tagline/history/materials/women_role) — reproduced live: blindly
      // interpolating a null field produced the literal text "null" in the
      // sentence (e.g. "from null, Rajasthan. null null Materials..."),
      // and that garbled-looking evidence made the model give up and fall
      // back to the generic refusal instead of answering from the parts
      // that WERE real. Only include each fact when it's actually present.
      const facts = [
        `The uploaded photo visually resembles "${matchedGI.name}" — GI Tag ${matchedGI.gi_tag} (registered ${matchedGI.year}), from ` +
          `${[matchedGI.district, matchedGI.state].filter(Boolean).join(', ')}.`,
        matchedGI.tagline,
        matchedGI.history,
        matchedGI.materials ? `Materials/technique: ${matchedGI.materials}.` : null,
        matchedGI.women_role,
      ].filter(Boolean)

      evidenceFromImage.push({
        source_id: `image:gi:${matchedGI.id}`,
        source_type: 'database',
        source_title: `Image match: ${matchedGI.name}`,
        source_reference: 'gi_products lookup, from uploaded photo',
        retrieved_text: facts.join(' '),
        relevance_score: 1,
        verification_status: 'verified',
      })

      // Check the real marketplace for a matching, buyable listing — same
      // "is it GI-verified" vs "do we sell it" separation the rest of this
      // pipeline already enforces (see the SYSTEM_PROMPT rule in
      // responseGenerator.ts). A GI match with nothing for sale is a
      // normal, honest answer, not a reason to fabricate availability.
      //
      // Filtered by category, not just craft name — reproduced live: a
      // photo of a Madhubani PAINTING correctly matched the GI craft
      // "Madhubani Painting" (category: handicraft), but the recommended
      // product was a "Madhubani ... Silk Stole/dupatta" (category:
      // textile) — a real, different product that happens to share the
      // craft name/art style, but is a completely different item (a scarf,
      // not a painting). The same craft can legitimately span multiple
      // product categories (Madhubani art appears on both paper and
      // textiles), so matching by name/craft alone isn't enough — a
      // painting photo should only ever recommend other paintings.
      const { data: matchingProducts } = await supabaseAdmin
        .from('products').select('*, artisan:artisans(*)')
        .eq('status', 'approved').gt('stock', 0).eq('state', matchedGI.state).eq('category', matchedGI.category)
      // Token-based, not substring — same word-order problem as
      // resolveGIProduct above: a real product named "Hand-Painted Jaipur
      // Blue Pottery Vase" doesn't contain "blue pottery of jaipur" (nor
      // the reverse) as a contiguous substring, even though it's obviously
      // that exact craft.
      const imageMatchedProduct = (matchingProducts ?? []).find(p =>
        (p.artisan?.craft && sameCraftByTokens(p.artisan.craft, matchedGI.name)) ||
        sameCraftByTokens(p.name, matchedGI.name)
      )
      if (imageMatchedProduct) {
        const imageRanked: RankedProduct = {
          product: imageMatchedProduct as never,
          matchedConstraints: ['matched from uploaded photo'],
          giVerification: { entity: matchedGI.name, gi_verified: true, region: matchedGI.state, craft_category: matchedGI.category, source: 'gi_products', source_confidence: 'high', verification_status: 'verified', gi_product: matchedGI },
          score: 1,
          breakdown: { semantic_relevance: 1, constraint_match: 1, gi_relevance: 1, cultural_relevance: 0.5, price_suitability: 0.5, availability: 1 },
          ranking_reason: `Matches the craft identified in your uploaded photo (${matchedGI.name}).`,
        }
        ranked = [imageRanked, ...ranked.filter(r => r.product.id !== imageMatchedProduct.id)]
      }
    } else {
      evidenceFromImage.push({
        source_id: 'image:no_match',
        source_type: 'static',
        source_title: 'Image Analysis',
        source_reference: 'uploaded photo, not matched to any known GI craft',
        retrieved_text:
          `The uploaded photo was analyzed (${imageIdentification.visualDescription || 'no clear description available'}), ` +
          `but it could not be confidently matched to any Geographical Indication craft in KalaStree's verified registry. ` +
          `Do not state a specific craft name, GI tag, or region for it as fact.`,
        relevance_score: 1,
        verification_status: 'not_verified',
      })

      // No confirmed GI craft, but the vision call can usually still name
      // the plain object/material it sees (imageIdentification.objectGuess,
      // e.g. "leather horse figurine") even when it can't confidently name
      // a specific registered craft — naming an object is a much lower bar
      // than recalling one of ~637 specific GI names from memory. Reproduced
      // live: without this, an unresolved photo turn returned ZERO ranked
      // products (the response model then improvised via its own
      // search_products tool call instead — real product names, but never
      // surfaced as actual clickable cards/sources to the user, just prose).
      // Search real marketplace listings by that object description, same
      // recall-favoring keyword approach entities.material already uses in
      // retrieval.ts, so a user at least sees real, honest, buyable
      // suggestions instead of nothing when the craft itself can't be
      // confirmed. Tagged 'matched from uploaded photo' so it survives the
      // ranked-list filter below, same as a real GI match would.
      //
      // Pulls candidate words from ALL THREE vision outputs — objectGuess
      // (e.g. "decorative animal figurine"), the fuller visualDescription
      // sentence (e.g. "...a stylized figurine of a deer with intricate
      // detailing" — "deer" is a real, useful word objectGuess alone never
      // surfaced), and even the unresolved craftGuess (e.g. "Kondapalli
      // Toys" didn't match the GI registry, but "toys" is still a real,
      // useful search word) — not just the 2-5 words in objectGuess. Each
      // word is an independent OR term (websearch syntax), so ANY single
      // match is enough to surface a real product — more candidate words
      // means more real chances to match, not a stricter requirement.
      const candidateWords = [
        ...new Set(
          [imageIdentification.craftGuess, imageIdentification.objectGuess, imageIdentification.visualDescription]
            .filter((s): s is string => !!s)
            .join(' ')
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(w => w.length >= 3 && !ENGLISH_STOPWORDS.has(w))
        ),
      ]
      // Dynamic, catalogue-driven filter (see filterToDistinctiveTerms) —
      // replaces what used to be a hand-maintained "generic word" list.
      const objectSearchTerms = await filterToDistinctiveTerms(candidateWords)

      // Real visual similarity search FIRST — compares the photo's actual
      // visual features (CLIP embeddings, via the Python backend's Chroma
      // Cloud collection) against real product photos directly, so it
      // isn't limited by whatever words the vision model happened to write
      // in its object description. Reproduced live: a distinctive blackbuck
      // figurine got described as a generic "deer" — a keyword search for
      // "deer" would miss the real "Handcrafted Leather Blackbuck Figure"
      // product entirely, even though it's visually an exact match. Only
      // falls through to the keyword search below (unchanged) when the
      // backend is cold/unreachable or genuinely finds nothing — see
      // retrieval.ts's retrieveImageSearchMatches.
      let objectMatches: CandidateProduct[] = []
      let matchedViaEmbedding = false
      // Chroma's .query() always returns its k nearest neighbors, REGARDLESS
      // of whether any of them are actually similar — for a photo with
      // nothing genuinely alike in this small catalogue, it still returns
      // "the least-dissimilar of what exists," not "no match." Reproduced
      // live with a real, unrelated photo (a bowl of popped lotus seeds):
      // the embedding search returned a spice box, an iron wall décor
      // piece, and a honey jar at scores 0.74-0.76 — while every previously
      // CONFIRMED-correct match in this pipeline (the blackbuck figure,
      // its related animal figures) scored 0.79 or higher. This floor is
      // picked directly from that real gap, not guessed: below it, treat
      // Chroma's return as "no real match" rather than trusting it blindly.
      const MIN_EMBEDDING_SIMILARITY = 0.78
      const relevantEmbeddingMatches = imageSearchMatches.filter(m => m.score >= MIN_EMBEDDING_SIMILARITY)
      // Tracks each match's REAL similarity score through to the ranking/
      // evidence stage below — reproduced live: uploading a product's own
      // actual catalogue photo came back at score 1.0 (an exact/near-exact
      // match, not a loose resemblance), but the answer used the SAME
      // generic hedged language ("may visually resemble... does not confirm
      // your exact item") for a 1.0 match as it would for a barely-passing
      // 0.78 one — that score was being computed and then thrown away
      // before it ever reached the response text. A near-perfect match is
      // strong real evidence this IS the same (or a duplicate) item, not
      // just "similar," and the answer should say so with real confidence.
      const embeddingScoreById = new Map(relevantEmbeddingMatches.map(m => [m.product_id, m.score]))
      if (relevantEmbeddingMatches.length) {
        const ids = relevantEmbeddingMatches.map(m => m.product_id)
        const { data } = await supabaseAdmin
          .from('products').select('*, artisan:artisans(*)')
          .eq('status', 'approved').gt('stock', 0).in('id', ids)
        const byId = new Map((data ?? []).map(p => [p.id, p]))
        // Preserve the similarity-ranked order from the embedding search
        // (closest match first), not whatever order Supabase returns rows in.
        objectMatches = ids.map(id => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p)
        matchedViaEmbedding = objectMatches.length > 0
      }

      if (!objectMatches.length && objectSearchTerms.length) {
        // search_vector (name + description), OR-combined across the
        // remaining significant words via websearch syntax — same full-text
        // index the site's own /shop search and tools.ts's search_products
        // already search successfully, and OR (not AND-by-default plain
        // websearch) so any ONE matching word is enough, not all of them.
        //
        // Fetches a WIDER pool (15, not 5) and ranks it client-side by how
        // many distinct search terms each product actually matches, rather
        // than trusting whatever order Postgres happens to return an OR
        // query in. Reproduced live: pulling search terms from the fuller
        // visualDescription sentence (not just objectGuess) let a common,
        // low-signal word ("detailing") slip past the generic-word filter —
        // it matched 22 unrelated products site-wide, and because nothing
        // ranked by relevance, a plain .limit(5) on that broad match set
        // buried the genuinely correct matches (multiple distinctive-word
        // hits) behind weak, single-word coincidental ones. Filtering out
        // more noise words helps, but ranking by actual match strength is
        // the structural fix — it stays correct even if a future noisy word
        // slips through the filter again.
        const { data } = await supabaseAdmin
          .from('products').select('*, artisan:artisans(*)')
          .eq('status', 'approved').gt('stock', 0)
          .textSearch('search_vector', objectSearchTerms.join(' OR '), { type: 'websearch', config: 'english' })
          .limit(15)
        const pool = data ?? []
        const termMatchCount = (p: (typeof pool)[number]) => {
          const haystack = `${p.name} ${p.category} ${p.description ?? ''}`.toLowerCase()
          return objectSearchTerms.filter(term => haystack.includes(term)).length
        }
        // Requires at least 2 distinct search-term matches (or all of them,
        // if only 1 term was ever extracted) — a single shared word is too
        // easily coincidental to trust alone. Reproduced live: a photo
        // described as "bowl of popped LOTUS seeds" pulled in a completely
        // unrelated "Hand-Painted Gond Art LOTUS Rakhi" — the ONLY thing
        // they share is the single word "lotus"; nothing else about a food
        // bowl resembles a painted rakhi. Requiring 2+ genuine term
        // overlaps (as every real, previously-confirmed match in this
        // pipeline already had — e.g. "leather" + "horse" + "figurine")
        // filters out this class of one-coincidental-word false positive
        // without weakening real matches, which always share more than one word.
        const MIN_TERM_MATCHES = Math.min(2, objectSearchTerms.length)
        objectMatches = pool
          .map(p => ({ p, score: termMatchCount(p) }))
          .filter(({ score }) => score >= MIN_TERM_MATCHES)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(({ p }) => p)
      }

      // A matched product can still be a REAL, verified GI product in its
      // own right — its craft just isn't confirmed to be the SAME one as
      // the photo. Reproduced live: this used to hardcode gi_verified:
      // false for every match here, but a real check against the registry
      // (matchesGIRegistry — the same deterministic check used everywhere
      // else in this pipeline) showed every one of a deer-figurine photo's
      // 4 matches was in fact a genuine registered GI product (Leather Toys
      // of Indore / Thanjavur Doll) — silently telling the user "not
      // GI-verified" about products that actually ARE was a real,
      // avoidable factual error, not just an overcautious phrasing choice.
      if (objectMatches.length) {
        const giProductsForFallback = await getAllGIProducts()
        let anyGiVerifiedMatch = false
        // Above this, a match is treated as essentially the same (or a
        // duplicate) item, not just "visually similar" — calibrated from
        // real data: uploading a product's own actual catalogue photo came
        // back at score 1.0, while every genuinely-just-similar match
        // confirmed elsewhere in this pipeline (the blackbuck case) topped
        // out around 0.93. 0.95 sits cleanly between "same item" and "very
        // good resemblance."
        const NEAR_IDENTICAL_SIMILARITY = 0.95
        let anyNearIdenticalMatch = false
        for (const p of objectMatches) {
          const giMatch = matchesGIRegistry(p as never, giProductsForFallback)
          if (giMatch) anyGiVerifiedMatch = true
          const embeddingScore = embeddingScoreById.get(p.id)
          const isNearIdentical = matchedViaEmbedding && embeddingScore != null && embeddingScore >= NEAR_IDENTICAL_SIMILARITY
          if (isNearIdentical) anyNearIdenticalMatch = true
          ranked.push({
            product: p as never,
            matchedConstraints: ['matched from uploaded photo'],
            giVerification: giMatch
              ? {
                  entity: giMatch.name, gi_verified: true, region: giMatch.state, craft_category: giMatch.category,
                  source: `KalaStree verified GI registry (tag: ${giMatch.gi_tag}, registered ${giMatch.year})`,
                  source_confidence: 'high', verification_status: 'verified', gi_product: giMatch,
                }
              : {
                  entity: p.gi_tag ?? p.name, gi_verified: false, region: null, craft_category: null,
                  source: null, source_confidence: null, verification_status: 'not_verified',
                },
            score: isNearIdentical ? 1 : 0.5,
            breakdown: { semantic_relevance: isNearIdentical ? 1 : 0.5, constraint_match: 0.3, gi_relevance: giMatch ? 0.8 : 0, cultural_relevance: 0, price_suitability: 0.5, availability: 1 },
            ranking_reason: isNearIdentical
              ? `This appears to be the exact same item as "${p.name}" already listed on KalaStree (near-perfect visual match)${giMatch ? `, and it is itself a verified GI product (${giMatch.name})` : ''}.`
              : giMatch
                ? `Visually similar to your uploaded photo, and this specific product is itself a verified GI product (${giMatch.name}) — though not confirmed as the exact same item you photographed.`
                : matchedViaEmbedding
                  ? 'Visually similar to your uploaded photo (real image match) — not a confirmed GI match.'
                  : `Visually/materially similar to your uploaded photo (${imageIdentification.objectGuess}) — not a confirmed GI match.`,
          })
        }

        evidenceFromImage.push({
          // source_id/verification_status stay exactly as before regardless
          // of which search path found these — responseGenerator.ts's
          // deterministic answer short-circuit keys on this exact id.
          source_id: 'image:object_fallback',
          source_type: 'database',
          source_title: matchedViaEmbedding
            ? 'Similar products based on photo (visual similarity match)'
            : `Similar products based on photo (${imageIdentification.objectGuess})`,
          source_reference: matchedViaEmbedding
            ? 'marketplace visual similarity search from uploaded photo'
            : 'marketplace keyword search from uploaded photo',
          retrieved_text:
            (anyNearIdenticalMatch
              ? `One or more of the products below is a NEAR-PERFECT visual match to the uploaded photo (see each product's own ` +
                `ranking reason for which) — confident enough to state plainly that the photographed item IS that product, not ` +
                `merely similar to it. `
              : '') +
            `Could not confirm which specific registered GI craft this exact photo shows, but found ${objectMatches.length} real ` +
            `KalaStree product(s) that ${matchedViaEmbedding ? 'visually resemble' : 'may match'} what it shows` +
            `${matchedViaEmbedding ? ' (found via real image similarity search, not just keyword matching)' : ` (${imageIdentification.objectGuess})`}. ` +
            `These are real, in-stock, buyable products.${anyGiVerifiedMatch
              ? ' Some of them ARE themselves genuinely verified GI products in their own right (see each product\'s own GI ' +
                'verification status below) — state that plainly when true. This is still NOT the same as confirming the ' +
                'PHOTOGRAPHED item is officially that exact GI piece — only that this particular listed product is a real, ' +
                'verified GI product that resembles it.'
              : ' None of them are confirmed GI-verified products — do not state or imply GI certification for them.'}`,
          relevance_score: 0.6,
          verification_status: 'not_verified',
        })
      }
    }
  }

  let evidence = buildEvidence(verification, ranked, narrative)
  evidence.push(...evidenceFromImage)

  // KalaStree-the-company domain (mission, founder) — a name matching the
  // founder wins any collision with a same-named marketplace artisan
  // (confirmed bug: "who is Garima Awasthi" was answering with an unrelated
  // artisan of the same name instead of the actual founder). Runs BEFORE
  // the marketplace artisan lookup below, deliberately.
  const artisanNameIsFounder = isFounderName(structuredQuery.entities.artisan)
  if (structuredQuery.intents.includes('kalastree_information') || artisanNameIsFounder) {
    evidence.unshift(...KALASTREE_EVIDENCE)
  }

  // A generic "what is a GI?" (no craft/state entity, so verifyGI above
  // returned null — nothing to look up) previously depended entirely on the
  // external research-corpus retrieval, which has no real definitional
  // passage and can also return nothing on a cold-started backend. Give it
  // the static definition instead. A specific question ("is Pashmina GI
  // tagged?") already gets a real verification result and doesn't need this.
  if (structuredQuery.intents.includes('gi_information') && !verification) {
    evidence.unshift(GI_DEFINITION_EVIDENCE)
  }

  // order_related had zero evidence wiring at all (see ORDER_RELATED_EVIDENCE
  // for why a static pointer, not a real lookup, is the honest fix here).
  if (structuredQuery.intents.includes('order_related')) {
    evidence.unshift(ORDER_RELATED_EVIDENCE)
  }

  // A request for a male artisan/product is answerable with a fixed,
  // verified platform fact regardless of which intent the query landed on
  // — deliberately NOT gated on needsProducts (see constraints.ts/
  // eligibility.ts for the case where it IS product_discovery, which now
  // correctly returns zero eligible products; this covers the case where a
  // short fragment like "made by men" doesn't reliably classify that way).
  if (structuredQuery.entities.artisan_gender === 'male') {
    evidence.unshift(WOMEN_ONLY_PLATFORM_EVIDENCE)
  }

  // A cross-state aggregate question ("which states have products", "list
  // products from every state") needs a real, live breakdown — not a
  // single-state-scoped search (state_information isn't in PRODUCT_INTENTS,
  // so candidates/ranked stay empty here) and not research-corpus estimates.
  // Gated on isAllStatesRequest(question) directly, not just on the LLM's
  // own state_information+state:null classification — the LLM alone isn't
  // precise enough here (regression caught by eval: "what states does
  // Kalastree ship to" — a shipping/logistics question with nothing to do
  // with product availability — was independently classified the same way
  // and got answered with the products-by-state breakdown instead of a
  // correct refusal).
  if ((isAllStatesRequest(question) || isTotalProductsRequest(question)) && structuredQuery.intents.includes('state_information')) {
    const byState = await getProductCountsByState()
    evidence.unshift({
      source_id: 'products:state_breakdown',
      source_type: 'database',
      source_title: 'Products by State',
      source_reference: 'products table, grouped by state',
      retrieved_text: byState.length
        ? `KalaStree currently has in-stock products from ${byState.length} state(s): ` +
          byState.map(s => `${s.state} (${s.count} product${s.count === 1 ? '' : 's'}, e.g. ${s.examples.join('; ')})`).join('. ') + '.'
        : 'KalaStree currently has no in-stock products from any state.',
      relevance_score: 1,
      verification_status: 'verified',
    })
  }

  // artisan_information ("who made this?", "tell me about artisan X") has
  // its own deterministic lookup — separate from the product pipeline,
  // since the user is asking about a person, not shopping.
  if (structuredQuery.intents.includes('artisan_information') && structuredQuery.entities.artisan) {
    if (artisanNameIsFounder) {
      // Founder evidence already added above. Still surface a same-named
      // marketplace artisan if one exists, but clearly as a SEPARATE
      // person — never blended into the founder's identity.
      const namesake = await findArtisanByName(structuredQuery.entities.artisan)
      if (namesake) {
        evidence.push({
          source_id: `artisans:${namesake.id}:namesake`,
          source_type: 'database',
          source_title: `Separate marketplace artisan also named ${namesake.name}`,
          source_reference: `artisans.id=${namesake.id}`,
          retrieved_text: `Note: KalaStree also has an unrelated marketplace artisan who happens to share this name — ${namesake.name}, a ${namesake.craft} artisan from ${namesake.state}. This is a different person from the KalaStree founder.`,
          relevance_score: 0.5,
          verification_status: namesake.is_verified ? 'verified' : 'not_verified',
        })
      }
    } else {
      const personName = structuredQuery.entities.artisan
      let artisan = await findArtisanByName(personName)
      let resolvedFuzzyFounder = false

      if (!artisan) {
        // Typo-tolerant last resort across the WHOLE known-person pool at
        // once (founder, co-founder, every real artisan) — see
        // resolvePersonName's doc comment (relationships.ts) for why this
        // can't safely be done as separate per-candidate fuzzy checks (it
        // could reintroduce the exact Manish/Manisha collision the exact
        // matching above was built to prevent). Reproduced live: "who is
        // manis rawat" (one letter short of the real co-founder, Manish
        // Rawat) fell all the way to the generic refusal.
        const allArtisans = await getAllArtisans()
        const pool: PersonCandidate<'founder' | 'cofounder' | typeof allArtisans[number]>[] = [
          { name: FOUNDER_NAME, data: 'founder' },
          { name: CO_FOUNDER_NAME, data: 'cofounder' },
          ...allArtisans.map(a => ({ name: a.name, data: a })),
        ]
        const resolved = resolvePersonName(personName, pool)
        if (resolved === 'founder' || resolved === 'cofounder') {
          resolvedFuzzyFounder = true
        } else if (resolved) {
          artisan = resolved
        }
      }

      if (resolvedFuzzyFounder) {
        evidence.unshift(...KALASTREE_EVIDENCE)
      } else if (artisan) {
        evidence.unshift({
          source_id: `artisans:${artisan.id}`,
          source_type: 'database',
          source_title: artisan.name,
          source_reference: `artisans.id=${artisan.id}`,
          retrieved_text: `${artisan.name} — ${artisan.craft} artisan from ${artisan.state}. ${artisan.bio ?? artisan.story ?? ''}`.trim(),
          relevance_score: 1,
          verification_status: artisan.is_verified ? 'verified' : 'not_verified',
        })

        // Without this, the LLM only sees the artisan's bio and (having
        // never been told whether products exist) tends to wrongly assert
        // "no products found" — an unverified claim. Give it the real count.
        const { data: artisanProducts } = await supabaseAdmin
          .from('products').select('name, price, stock').eq('artisan_id', artisan.id).gt('stock', 0)
        evidence.push({
          source_id: `artisans:${artisan.id}:products`,
          source_type: 'database',
          source_title: `${artisan.name}'s products`,
          source_reference: `products.artisan_id=${artisan.id}`,
          retrieved_text: artisanProducts?.length
            ? artisanProducts.map(p => `${p.name} — ₹${p.price}`).join('; ')
            : `${artisan.name} currently has no in-stock products listed.`,
          relevance_score: 1,
          verification_status: 'verified',
        })
      } else {
        // Not in the artisans table, not the founder/co-founder (exactly
        // or via a tolerable typo) — before declaring the name unknown,
        // check every other public, name-bearing source on the site, in
        // order: the About page's own founding story, News & Events, then
        // product reviews. See each helper's doc comment for the
        // reproduced case it fixes (e.g. "who is Sunita?" — the About
        // page's origin story literally names her, but she isn't in any
        // table).
        const aboutMention = findAboutStoryMention(personName)
        if (aboutMention) {
          evidence.unshift({
            source_id: `about:story:${personName}`,
            source_type: 'static',
            source_title: 'About KalaStree — Why KalaStree?',
            source_reference: 'src/lib/i18n/dictionaries/about.ts (About page story)',
            retrieved_text:
              `"${personName}" is not a KalaStree marketplace artisan, but is named in the About page's founding ` +
              `story: "${aboutMention.paragraph}"`,
            relevance_score: 1,
            verification_status: 'verified',
          })
        } else {
          const newsMention = await findNewsMentioningPerson(personName)
          if (newsMention) {
            evidence.unshift({
              source_id: `news:${newsMention.title}`,
              source_type: 'database',
              source_title: newsMention.title,
              source_reference: 'news_events lookup',
              retrieved_text:
                `"${personName}" is not a KalaStree marketplace artisan, but is mentioned in a ` +
                `KalaStree News & Events entry: "${newsMention.title}"${newsMention.author ? ` (author: ${newsMention.author})` : ''}, ` +
                `published ${newsMention.published_at}.${newsMention.external_link ? ` Link: ${newsMention.external_link}` : ''}`,
              relevance_score: 1,
              verification_status: 'verified',
            })
          } else {
            // Still nothing — check the last public, name-bearing source:
            // product reviews (reviewer_name only; see
            // findReviewMentioningPerson's doc comment for why private
            // account/order tables are deliberately never checked here).
            const reviewMention = await findReviewMentioningPerson(personName)
            if (reviewMention) {
              evidence.unshift({
                source_id: `reviews:${reviewMention.reviewerName}`,
                source_type: 'database',
                source_title: `Review by ${reviewMention.reviewerName}`,
                source_reference: 'reviews lookup',
                retrieved_text:
                  `"${personName}" is not a KalaStree marketplace artisan, but left a ${reviewMention.rating}-star ` +
                  `product review${reviewMention.productName ? ` for "${reviewMention.productName}"` : ''}` +
                  `${reviewMention.title ? `, titled "${reviewMention.title}"` : ''} on KalaStree.`,
                relevance_score: 1,
                verification_status: 'verified',
              })
            } else {
              evidence.unshift({
                source_id: `artisans:not_found:${personName}`,
                source_type: 'database',
                source_title: 'Artisan Lookup',
                source_reference: 'artisans/about/news/reviews lookup (no match)',
                retrieved_text: `No artisan named "${personName}" was found in the verified artisan records, and no mention of that name was found on the About page, in News & Events, or in product reviews either.`,
                relevance_score: 1,
                verification_status: 'not_verified',
              })
            }
          }
        }
      }
    }
  }

  // source_inquiry ("where did you get that?") must answer from what was
  // ACTUALLY used to produce the previous answer, not a fresh retrieval on
  // the sourcing question's own text — that finds nothing related and
  // produces an untraceable-claim refusal instead of the real answer.
  // Deliberately REPLACES (not merges) the evidence gathered above: a pure
  // "where did that come from" question shouldn't be answered by newly
  // retrieved, unrelated facts.
  if (structuredQuery.intents.includes('source_inquiry')) {
    evidence = previousEvidence ?? []
  }

  // Same "replace, don't merge" reasoning as source_inquiry above, for an
  // uploaded photo: reproduced live — with a correct, clean image-match
  // evidence entry PLUS the generic text-driven noise this pipeline
  // normally builds (5 unrelated in-stock products, several garbled
  // research-corpus rows for a question with no real text anchor of its
  // own), the model gave the generic fallback despite the good evidence
  // being right there; in isolation, that same evidence answered
  // correctly. A photo's own analysis is the primary, most relevant
  // answer to "what is this" — it should not compete with unrelated
  // generic evidence for the model's attention.
  //
  // Rebuilds (not just discards) the product evidence from the FILTERED
  // ranked list, rather than only keeping evidenceFromImage — buildEvidence
  // already generates a real, priced evidence entry per ranked product,
  // and simply dropping that lost the image-matched product's own price,
  // triggering a (correct!) groundedness warning when the model then
  // stated that price without it being traceable in the evidence text.
  // narrative is intentionally NOT re-included — it's the noisy part.
  // Uses imageVerification (the IMAGE's own resolution), NEVER the outer
  // `verification` — that one reflects possibly-stale TEXT entities
  // carried over from before this photo was even uploaded (see
  // imageVerification's own doc comment above for the reproduced bug this
  // fixes: an unrelated craft from the PREVIOUS turn leaking into this
  // photo's evidence).
  if (imageIdentification) {
    ranked = ranked.filter(r => r.matchedConstraints.includes('matched from uploaded photo'))
    evidence = [...evidenceFromImage, ...buildEvidence(imageVerification, ranked, [])]
  }

  const t4 = Date.now()

  const { answer, finalContext, groundednessWarnings } = await generateResponse(
    question, structuredQuery, verification, evidence, ranked, history, needsProducts
  )
  const t5 = Date.now()

  const latency_ms = {
    query_understanding_ms: t1 - t0,
    verification_and_narrative_ms: t2 - t1,
    candidate_retrieval_ms: t3 - t2,
    // Includes eligibility, ranking, evidence assembly, and the
    // artisan_information lookup above — all the remaining deterministic
    // work between candidate retrieval and final generation.
    eligibility_and_ranking_ms: t4 - t3,
    response_generation_ms: t5 - t4,
    total_ms: t5 - t0,
  }

  const sources = [...new Set(evidence.map(e => e.source_title))]
  const topRanked = ranked.slice(0, 5)
  const matchedConstraints = [...new Set(topRanked.flatMap(r => r.matchedConstraints))]

  // Anonymous technical metrics (spec section 24) — no user identity, no
  // raw free-text beyond a truncated query preview for debugging context.
  console.log('[chat-metrics]', JSON.stringify({
    intents: structuredQuery.intents,
    query_preview: question.slice(0, 80),
    needs_products: needsProducts,
    gi_verification_status: verification?.verification_status ?? null,
    candidate_count: candidates.length,
    eligible_count: eligible.length,
    returned_count: topRanked.length,
    groundedness_warning_count: groundednessWarnings.length,
    latency_ms,
  }))

  const debug: DebugInfo | null = includeDebug
    ? {
        original_query: question,
        structured_query: structuredQuery,
        constraints,
        verification: verification ? [verification] : [],
        candidate_count: candidates.length,
        eligible_count: eligible.length,
        ranked: topRanked,
        evidence,
        final_context: finalContext + (groundednessWarnings.length ? `\n\n[groundedness warnings: ${groundednessWarnings.join('; ')}]` : ''),
        latency_ms,
        groundedness_warnings: groundednessWarnings,
      }
    : null

  return {
    answer,
    sources,
    products: topRanked.map(publicProduct),
    matchedConstraints,
    structuredQuery,
    evidence,
    debug,
  }
}
