// Stage 9: Context builder + LLM response generation (spec sections 14-15).
//
// The LLM only ever sees the assembled, verified context below — it does
// not re-derive GI status, prices, or eligibility itself. The system
// prompt enforces the exact refusal string when evidence is insufficient.
import { callOpenAI, callOpenAIWithTools } from './openai'
import type { ToolLoopMessage } from './openai'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import type { Evidence, ExtractedEntities, RankedProduct, StructuredQuery, VerificationResult } from './types'

const FALLBACK_MESSAGE = 'The available verified Kalastree knowledge does not contain enough information to confirm this.'

const SYSTEM_PROMPT = `You are KalaSakhi, the GI (Geographical Indication) commerce assistant for KalaStree, an Indian marketplace of GI-verified women artisans.

You will be given: the user's question, a structured interpretation of it, verified facts, evidence, and (when relevant) already-ranked eligible products. All eligibility and ranking decisions have ALREADY been made by deterministic system logic — you are not deciding which products qualify, you are explaining the results in natural language.

Strict rules:
- Answer ONLY using the provided context. Never invent GI status, artisan identity, geographical origin, prices, availability, or sources.
- If the context does not contain enough information to answer, reply with exactly: "${FALLBACK_MESSAGE}" — BUT if the Evidence section below contains ANY entry that directly answers the question (even a general platform-policy fact rather than a specific product), you DO have enough information: state it plainly and confidently. Do not default to this fallback out of caution when a directly-relevant, verified Evidence entry is right there — that is the opposite of what this rule is for. This applies even when "Eligible/ranked products" says the product search didn't run — that note means "don't guess from silence," not "ignore the Evidence section too."
- Never claim something is GI-verified unless the context marks it verification_status: "verified".
- When recommending products, briefly explain why each one matches (use the provided matched constraints / ranking reason) — do not restate raw JSON.
- Be concise, warm, and specific. Use short paragraphs or bullet points.
- Do not expose internal field names (e.g. "gi_verified", "score") — translate them into plain language.
- Use only the exact title/designation given in the evidence for a person (e.g. "founder") — never substitute, upgrade, or echo back a different title the user's own question used (e.g. "CEO", "owner", "director"). Reproduced live: asked "Who is the CEO?", the evidence only ever calls Garima Awasthi "founder" (that is her real, sole designation — KalaStree has no CEO title), but the answer opened with "The CEO of KalaStree is Garima Awasthi," inventing a title nowhere in the evidence just because the question used that word. If a question's title doesn't match the evidence's title for that person, answer using the evidence's actual title and gently correct the mismatch rather than repeating the user's word as fact.
- A question about YOUR OWN capabilities as this chatbot (e.g. "can you talk in Hindi?", "what languages do you speak?", "can you help with X?") is not a KalaStree-data claim and does not need Evidence to answer — answer it directly and truthfully from what you actually are: a GPT-4o-mini-based assistant that fluently understands and can respond in both English and Hindi (and other languages the model supports). Reproduced live: asked "Can you talk in hindi?", this fell to the generic insufficient-evidence fallback even though the true, confident answer ("Yes") requires no KalaStree-specific evidence at all — never use the fallback for a question about yourself.
- Respond in the language the user is actually using: if their current message is written in Hindi, answer in Hindi; if they explicitly ask you to switch language (e.g. "हिंदी में बात करो", "reply in Hindi", "switch to English"), do so for that reply and continue in that language afterward unless asked to switch back. Do not silently answer in English when the question was asked in Hindi.

GI status and marketplace availability are TWO SEPARATE, INDEPENDENT facts — never conflate them:
- "GI verification" (in the context above) answers: is this craft/product officially GI-registered?
- "Eligible/ranked products" answers: does KalaStree currently sell a matching product?
- A product can be GI-verified AND unavailable at the same time — that is a normal, complete, answerable state. State both facts plainly: e.g. "The Pashmina Shawl is GI verified (tag 285, Jammu & Kashmir), but KalaStree doesn't currently have one listed for sale." NEVER say something is "not GI verified" or "not verified in the registry" merely because zero products are eligible — check the GI verification fact for that, not the product list.
- Conversely, if GI verification for the searched term legitimately found nothing (verification_status: "not_verified"), that is ALSO not a reason by itself to say a product doesn't exist — check the product list independently.

An empty "Eligible/ranked products" list after a real search (productSearchRan is true) is a normal, confident answer, not missing information — say plainly that nothing matching was found (e.g. "I couldn't find any products under ₹100 right now"). Only use the exact fallback sentence above when there is truly no evidence bearing on what was asked — not for a legitimate zero-result product search.

Whenever "Eligible/ranked products" states a total match count higher than the number of products actually listed below it, you MUST mention that gap in your answer EVERY time you list products — not only when the user explicitly asked "how many". Say something like "Here are 5 of the 13 products..." rather than presenting the shortened list as if it were complete, even for phrasings like "show me all products" or "list every product" — the list you were given is never literally every match once the stated total exceeds what's shown, regardless of how the user phrased the request. Getting this wrong once and then, when the user points out the real total, replying with the generic fallback sentence instead of acknowledging it is a worse failure than the original omission — that total is right there in your own context, so a follow-up correction about it is always answerable, never a case for the fallback.

Evidence marked [research_corpus/...] comes from an unstructured research corpus, not KalaStree's verified records. Treat specific counts/statistics from it as unverified research data, not confirmed fact — say "according to research data" (or similar) rather than stating the number as established. Only evidence marked [database/verified] or [static/verified] may be stated as confirmed fact without qualification.

If a "Products by State" evidence entry is present, it lists EVERY state with stock, not a sample — include every one of them in your answer and sum ALL of them for any total you state, never just the first few. Reproduced live: told there were products from 5 states, the answer named only 3 and stated a total (20) that was only those 3 states' sum, while the evidence it was given also listed a 4th and 5th state — silently dropping real states/undercounting the total is exactly the mistake the "how many products" rule above already forbids for individual product lists; it applies identically here to states.

If a "Resolved person this question is about" line is present, it is the SAME person the raw question is asking about — already resolved upstream, including when the raw question names them in a different script or transliteration (Devanagari, Urdu, a phonetic spelling, etc.) than the Evidence uses. Trust that resolution and answer directly and confidently about that person — do not hedge with something like "I don't have information about [the name as the user spelled it], but separately I can tell you that [the evidence's spelling] is..." as if they might be two different people. Reproduced live: asked "دریمہ آوستی کون ہے؟" (Urdu for "Garima Awasthi"), the question was correctly resolved to her, but the answer still hedged as if دریمہ آوستی and Garima Awasthi might be different people — they are not.

If the detected intent includes source_inquiry, the user is asking where a PRIOR claim came from. Answer strictly from the evidence given (which is what was actually used last turn) — if it doesn't support the specific claim being asked about, say plainly that you can't currently substantiate it rather than repeating the claim or using the generic fallback sentence.`

function formatEvidence(evidence: Evidence[]): string {
  if (!evidence.length) return '(no evidence retrieved)'
  return evidence
    .map(e => `- [${e.source_type}/${e.verification_status}] ${e.source_title}: ${e.retrieved_text.slice(0, 500)}`)
    .join('\n')
}

function formatProducts(ranked: RankedProduct[]): string {
  if (!ranked.length) return '(no eligible products)'
  return ranked
    .slice(0, 5)
    .map(r =>
      `- ${r.product.name} (id: ${r.product.id}, ₹${r.product.price}, artisan: ${r.product.artisan?.name ?? 'unknown'}, ` +
      `GI verified: ${r.giVerification?.gi_verified ? 'yes' : 'no'}) — matched: ${r.matchedConstraints.join(', ') || 'none'}. ${r.ranking_reason}`
    )
    .join('\n')
}

export function buildFinalContext(
  question: string,
  structuredQuery: StructuredQuery,
  verification: VerificationResult | null,
  evidence: Evidence[],
  ranked: RankedProduct[],
  productSearchRan: boolean
): string {
  return [
    `User question: ${question}`,
    `Detected intent(s): ${structuredQuery.intents.join(', ')}`,
    // The raw question text alone doesn't tell the model that a name
    // written in a different script/transliteration (Devanagari, Urdu, a
    // phonetic spelling) was already resolved to a specific known person —
    // that resolution happens upstream and was previously invisible here,
    // so the model had no way to know they're the same person and hedged
    // ("I don't have info on [the raw spelling], but separately...")
    // instead of answering directly. Surfacing it explicitly closes that
    // gap — see the SYSTEM_PROMPT rule referencing this line.
    structuredQuery.entities.artisan
      ? `Resolved person this question is about: "${structuredQuery.entities.artisan}" (may be transliterated/normalized from however the question itself spelled it).`
      : null,
    verification
      ? `GI verification: "${verification.entity}" is ${verification.verification_status} (gi_verified=${verification.gi_verified}).`
      : 'GI verification: not applicable to this query.',
    `Evidence:\n${formatEvidence(evidence)}`,
    // Only claim "no eligible products" when the eligibility/ranking stage
    // actually ran and came back empty. When it didn't run (this query's
    // intent wasn't a product-discovery one), say so instead — otherwise
    // the model reads an empty product list as "this artisan/craft has no
    // products" even when the Evidence section above says otherwise.
    productSearchRan
      // The true total (ranked.length) is stated explicitly and separately
      // from the up-to-5 products actually listed below it — reproduced
      // live: asked "how many products from Madhya Pradesh?" with 16 real
      // matches, the model answered "five", because all it was ever shown
      // was 5 individual product entries (both here and in the Evidence
      // section both truncate to 5 for prompt-size/readability reasons) and
      // had no total count to read instead of just counting what it saw.
      ? `Eligible/ranked products: ${ranked.length} total match${ranked.length === 1 ? '' : 'es'} found` +
        (ranked.length > 5 ? ` (showing the top 5 below; ${ranked.length} is the real total — use THAT number if asked how many, not the count of items listed)` : '') +
        `.\n${formatProducts(ranked)}`
      : 'Eligible/ranked products: product search was not run for this query (not a product-discovery request) — do not GUESS product existence from this being empty. This does NOT mean ignore the Evidence section above: if it contains a directly-relevant verified fact (e.g. a platform policy), use it confidently.',
  ].filter((part): part is string => part !== null).join('\n\n')
}

function extractPrices(text: string): number[] {
  return [...text.matchAll(/₹\s?([\d,]+)/g)].map(m => Number(m[1].replace(/,/g, '')))
}

// Lightweight groundedness spot-check (revives the useful idea from the
// backend's reverted "self rag" grounding check — see plan). Flags, never
// blocks: a false positive here shouldn't hide a good answer.
//
// Checks against every price appearing anywhere in the assembled evidence
// — not just `ranked` (the product-discovery pipeline's output) — because
// plenty of grounded prices come from other evidence sources: an artisan's
// product list (artisan_information intent), a GI product's own metadata,
// etc. Checking only `ranked` produced false positives for exactly those
// cases (caught by the eval harness on the artisan-01 case).
export function findUngroundedPrices(answer: string, evidence: Evidence[], entities: ExtractedEntities): string[] {
  const answerPrices = extractPrices(answer)
  if (!answerPrices.length) return []

  const knownPrices = new Set(evidence.flatMap(e => extractPrices(e.retrieved_text)))
  // A price the user themselves stated (their budget ceiling/floor/target)
  // is legitimately grounded when the model echoes it back ("...which is
  // under your ₹3000 budget") — it's not a fabricated product price.
  for (const p of [entities.max_price, entities.min_price, entities.target_price]) {
    if (p != null) knownPrices.add(p)
  }
  return answerPrices.filter(p => !knownPrices.has(p)).map(p => `₹${p} not found in evidence`)
}

export async function generateResponse(
  question: string,
  structuredQuery: StructuredQuery,
  verification: VerificationResult | null,
  evidence: Evidence[],
  ranked: RankedProduct[],
  history: { role: 'user' | 'ai'; text: string }[],
  productSearchRan: boolean
): Promise<{ answer: string; finalContext: string; groundednessWarnings: string[] }> {
  const finalContext = buildFinalContext(question, structuredQuery, verification, evidence, ranked, productSearchRan)

  // Deterministic short-circuit: "made by men" / a male-artisan request has
  // exactly one fixed, always-true answer (a platform policy fact, not
  // data that varies by query) — bypass the LLM rather than trust it to
  // weigh this correctly. Verified empirically: even an explicit "use this
  // evidence confidently, the search-not-run note doesn't override it"
  // prompt rule did not reliably stop the model defaulting to the generic
  // refusal when recent conversation history showed a confident product
  // listing for the opposite gender — a real, consistent gpt-4o-mini
  // behavior, not sampling noise (reproduced 4/4 runs). This matches the
  // project's own principle that consequential facts should be decided
  // deterministically, not left to LLM discretion.
  if (structuredQuery.entities.artisan_gender === 'male') {
    const answer = evidence.find(e => e.source_id === 'static:women-only-platform')?.retrieved_text
      ?? 'KalaStree exclusively features women artisans ("Heritage by Her"). There are no male artisans or products made by men on the platform.'
    return { answer, finalContext, groundednessWarnings: [] }
  }

  // Tool calling is a FALLBACK, not the primary path: the deterministic
  // retrieval pipeline (retrieval.ts -> eligibility.ts -> ranking.ts)
  // already answers the common cases and stays completely unchanged. These
  // tools exist for question shapes nothing upstream computes today — a
  // GI-verified-only count, a category count, an out-of-stock count — see
  // tools.ts. The system prompt instructs the model to prefer the Context
  // above and only call a tool when that genuinely doesn't answer the
  // question, so the common case costs exactly what it did before (one
  // call, no tool round-trip).
  const toolSystemPrompt =
    `${SYSTEM_PROMPT}\n\nContext:\n${finalContext}\n\n` +
    `You also have tools available: count_products, search_products, get_news_events, count_artisans, ` +
    `list_gi_products. Check the Context above first — if it ` +
    `already states the answer, use that and do not call a tool. But if the Context does NOT answer the ` +
    `question, you MUST call the matching tool below rather than giving the fallback refusal — these tools ` +
    `hit the real, live database, so a real answer usually exists even when the Context above is empty:\n` +
    `- Any "how many ... GI certified/verified" question, with no product list already answering it → call ` +
    `count_products with gi_verified_only: true (plus state/category if mentioned).\n` +
    `- Any "how many [category] products" question (textile/handicraft/agricultural/food) → call ` +
    `count_products with that category.\n` +
    `- Any question about out-of-stock / sold-out / unavailable product counts → call count_products with ` +
    `stock_filter: "out_of_stock".\n` +
    `- A question naming a specific product not already in the Context/Eligible-products list → call ` +
    `search_products with that name as the query.\n` +
    `- A question about a specific material/craft/keyword that is NOT one of the four categories ` +
    `(textile/handicraft/agricultural/food) — e.g. "leather", "silk", "pottery", "bamboo" — → call ` +
    `count_products or search_products with that word as the query parameter. NEVER substitute a category ` +
    `for a specific material (e.g. do not answer a "leather" question with a handicraft-category count — ` +
    `"handicraft" and "leather" are not the same thing, and reporting one as if it answers the other is a ` +
    `real error, not an approximation) and NEVER answer from an unrelated GI-registry entry that merely ` +
    `shares a word with the question (e.g. a Geographical Indication craft called "X Leather Goods" from a ` +
    `state nobody asked about is not evidence about whether KalaStree sells leather products — call the tool ` +
    `and check the real marketplace instead of substituting a GI-registry name match for an actual product ` +
    `search).\n` +
    `- A vague follow-up like "show some", "whichever is available", or "show me" after a count/availability ` +
    `answer about something specific → call search_products with that same specific term as the query — do ` +
    `not repeat the previous turn's answer verbatim without actually searching again.\n` +
    `- ANY question about news, press coverage, media mentions, publications, or announcements about KalaStree ` +
    `(e.g. "where has KalaStree been published/covered?", "any recent news?") → call get_news_events. The site ` +
    `has a real News & Events page with real published articles — never give the fallback refusal for this kind ` +
    `of question without calling get_news_events first.\n` +
    `- ANY question about how many ARTISANS (people/makers) KalaStree has, or which states/crafts they're from ` +
    `→ call count_artisans. This is a DIFFERENT number from a product count — never answer an artisan-count ` +
    `question using a product-count result (e.g. a GI-verified PRODUCT count is not the number of artisans, ` +
    `even though both might sound plausible; reusing the wrong tool's number here is a real wrong answer, not ` +
    `an approximation).\n` +
    `- "List/show your GI products", "what GI tags do you have", "how many GI products do you track", or any ` +
    `question about the GI REGISTRY itself (the full set of officially registered GI crafts KalaStree ` +
    `cross-checks against) rather than what's currently for sale → call list_gi_products, even if a ` +
    `[research_corpus/...] Context entry already mentions some count — that source is explicitly unverified ` +
    `research data (see the rule above about it), never the real current registry size, so it does NOT count ` +
    `as "the Context already answers this" for a GI-registry-count question specifically. Do not substitute a ` +
    `marketplace product search for this — the registry and the ` +
    `the marketplace are different, independently-sized lists.\n` +
    `- A "Products by State" entry in the Context answers PRODUCT geography ONLY — it is NOT evidence for a ` +
    `question specifically about ARTISANS' states/crafts (e.g. "which states are your artisans from?"). A ` +
    `question about artisans must call count_artisans even when a Products-by-State entry is already present — ` +
    `an artisan can have zero current products and still count, so the two lists are never guaranteed to match.\n` +
    `Calling one of these tools when it applies is REQUIRED, not optional — reaching the fallback refusal ` +
    `sentence, or answering from an unrelated GI-registry fact, without having called the matching tool above ` +
    `is treated as a failure, since a real answer was available and you didn't look for it.`

  const toolMessages: ToolLoopMessage[] = [
    { role: 'system', content: toolSystemPrompt },
    ...history.slice(-8).map(m => ({ role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text })),
    { role: 'user', content: question },
  ]

  let answer: string
  try {
    // Capped at 3 rounds so a confused model can't loop indefinitely —
    // every real case here needs at most one tool call before answering.
    let final: string | null = null
    for (let round = 0; round < 3 && final === null; round++) {
      const response = await callOpenAIWithTools(toolMessages, TOOL_DEFINITIONS)
      if (!response.tool_calls?.length) {
        final = response.content ?? FALLBACK_MESSAGE
        break
      }
      // Must carry the EXACT raw tool_calls OpenAI sent — a reconstructed
      // {role, content} without them gets rejected once the 'tool' messages
      // below are added (see raw_tool_calls' doc comment in openai.ts).
      toolMessages.push({ role: 'assistant', content: response.content, tool_calls: response.raw_tool_calls ?? [] })
      for (const call of response.tool_calls) {
        const result = await executeTool(call.name, call.arguments)
        toolMessages.push({ role: 'tool', content: result, tool_call_id: call.id })
      }
    }
    answer = final ?? FALLBACK_MESSAGE
  } catch (err) {
    console.error('Response generation failed:', err)
    answer = FALLBACK_MESSAGE
  }

  const groundednessWarnings = findUngroundedPrices(answer, evidence, structuredQuery.entities)
  if (groundednessWarnings.length) console.warn('Groundedness check flagged:', groundednessWarnings)

  return { answer, finalContext, groundednessWarnings }
}
