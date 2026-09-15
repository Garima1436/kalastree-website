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
import { getAllGIProducts, findArtisanByName, findNewsMentioningPerson, findReviewMentioningPerson, getProductCountsByState } from './relationships'
import { retrieveCandidateProducts, retrieveNarrativeEvidence, warmUpChatbotBackend } from './retrieval'
import { filterEligible } from './eligibility'
import { rankProducts } from './ranking'
import { buildEvidence } from './evidence'
import { generateResponse } from './responseGenerator'
import { KALASTREE_EVIDENCE, WOMEN_ONLY_PLATFORM_EVIDENCE, GI_DEFINITION_EVIDENCE, ORDER_RELATED_EVIDENCE, isFounderName, findAboutStoryMention } from './kalastreeInfo'
import { PRODUCT_INTENTS } from './types'
import type { DebugInfo, Evidence, StructuredQuery } from './types'

interface HistoryMessage {
  role: 'user' | 'ai'
  text: string
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
  previousEvidence: Evidence[] | null = null
): Promise<PipelineResult> {
  const t0 = Date.now()
  // Fire-and-forget, before intents are known — see retrieval.ts for why.
  warmUpChatbotBackend()
  const structuredQuery = await understandQuery(question, history, previousQuery)
  const t1 = Date.now()
  const needsProducts = structuredQuery.intents.some(i => PRODUCT_INTENTS.includes(i))

  const [verification, narrative] = await Promise.all([
    verifyGI(structuredQuery.entities),
    retrieveNarrativeEvidence(question, structuredQuery.intents),
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

  let evidence = buildEvidence(verification, ranked, narrative)

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
      const artisan = await findArtisanByName(structuredQuery.entities.artisan)
      if (artisan) {
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
        // Not in the artisans table and not the founder/co-founder — before
        // declaring the name unknown, check every other public,
        // name-bearing source on the site, in order: the About page's own
        // founding story, News & Events, then product reviews. See each
        // helper's doc comment for the reproduced case it fixes (e.g. "who
        // is Sunita?" — the About page's origin story literally names her,
        // but she isn't in any table).
        const personName = structuredQuery.entities.artisan
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
