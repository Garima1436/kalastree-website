// Stage 1: Intent + entity extraction (spec sections 3-5, 18).
//
// This is the ONLY place the LLM is asked to interpret the raw user
// message into structure. It must not be asked to decide anything
// consequential (GI status, prices, eligibility) — those are deterministic
// stages downstream. If extraction fails or returns malformed JSON, we fall
// back to an empty structured query rather than guessing.
import { callOpenAI } from './openai'
import { normalizeCraft, normalizeState, scanForStateName } from './entityNormalization'
import type { StructuredQuery, ExtractedEntities, Intent } from './types'
import { PRODUCT_INTENTS } from './types'

interface HistoryMessage {
  role: 'user' | 'ai'
  text: string
}

const VALID_INTENTS: Intent[] = [
  'product_discovery', 'product_information', 'artisan_information', 'craft_information',
  'gi_information', 'state_information', 'product_comparison', 'recommendation',
  'purchase_assistance', 'cultural_information', 'order_related', 'general_question',
  'kalastree_information', 'source_inquiry',
]

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, artisan_gender_mode: null, min_price: null, max_price: null,
  target_price: null, price_mode: null, quantity: null, gifting_purpose: null,
  cultural_preference: null, material: null, colour: null, size: null, occasion: null,
  traditional: null, handmade: null,
}

const SYSTEM_PROMPT = `You are the query-understanding stage of a GI (Geographical Indication) commerce assistant for KalaStree, an Indian marketplace for GI-verified women artisans.

Extract intent(s) and entities from the user's message as JSON. Rules:
- Output ONLY valid JSON matching the schema below. No prose.
- "intents" is an array; include every intent that applies (e.g. a product request that also asks "why is it important" gets both product_discovery and craft_information).
- Every entity field must be null if the user did not specify it. NEVER guess or infer a value that wasn't stated or clearly implied (e.g. do not invent a price, a state, or a GI status).
- price_mode: "max" if the user said "under/below/within X", "min" if "above/over X", "target" if "around/about/approximately X". null if no price mentioned.
- gi_required: true only if the user explicitly asked for GI-certified/authentic/GI-tagged items. Otherwise null.
- artisan_gender_mode (only set when artisan_gender is set): "required" for a firm statement — "made by a woman artisan", "only women artisans", "must be a woman artisan" — this is the DEFAULT for plain/unhedged mentions. "preferred" ONLY when the wording itself signals a soft preference — "I prefer a woman artisan", "preferably a woman artisan", "ideally by a woman". When in doubt, use "required".
- Conversation history is provided ONLY to resolve what the user's latest message refers back to (e.g. "under 3000" after "show me Madhubani paintings" means craft=Madhubani Painting, max_price=3000). Extract entities ONLY from words the USER actually wrote across their own turns. NEVER pull a value from the assistant's prior replies (product names, artisan names, materials, prices it mentioned) unless the user's own message repeats or confirms it themselves — the assistant's answers are not user-stated facts.
- Phrasing variants asking about the same entity must produce the SAME intent and the SAME entities. "About X", "Who is X?", "Tell me about X", "Give information about X", and "Who is the artisan X?" are ALL artisan_information with entities.artisan = X. Likewise "What is Kalastree?", "Tell me about Kalastree", "Who founded Kalastree?", and "What does Kalastree do?" are ALL kalastree_information — do not classify a plain rewording as a different intent.
- kalastree_information is for questions about the KalaStree company/platform itself (what it is, its mission, its founder) — NOT about a GI product, craft, artisan, or marketplace product. "Who is Garima Awasthi" is artisan_information (she may also be the founder — that's resolved later in the pipeline, not by you).
- "What GI tag number does X have?", "What is X's GI tag number?", "What is the registration number/year for X?" are gi_information intent with entities.craft = X — extract X as the craft/product being asked about exactly as you would for "Is X GI certified?". Do not let the words "tag" or "number" stop you from recognizing X as the craft entity — this phrasing is asking for a specific fact ABOUT a named craft, not a generic question with nothing to extract.
- A question asking about state coverage IN AGGREGATE across MULTIPLE states, with no single state named — "which states have products", "how many products per state", "list products from every state" — is state_information intent with entities.state = null. This is DIFFERENT from an ordinary question about products from ONE named state ("what products does Madhya Pradesh have", "products from Bihar") — that is still product_discovery with entities.state set to the named state, exactly as for any other state question. Do not reclassify a single-named-state product question as the aggregate case.
- source_inquiry is for a follow-up asking where a PRIOR claim came from — "where did you get that", "what's your source for X", "how do you know that", "where is that from". Use it only when the user is asking about the origin of something already said in this conversation, not when asking a new factual question.
- The user may write in Hindi, English, Urdu, or another script/language, including a rough phonetic spelling. Regardless of input language or script, output entity string values (state, craft, product_type, material, colour, occasion, gifting_purpose, cultural_preference) in English using the standard canonical English name (e.g. "बिहार" -> "Bihar", "साड़ी" -> "saree") — these are matched against an English-language database. For entities.artisan specifically: ALWAYS attempt a best-effort Latin-script transliteration of the person's name, in ANY script (Devanagari, Urdu/Arabic, etc.) — do not return null just because the spelling is unusual, phonetic, or you are not fully certain of the exact standard spelling. A reasonable phonetic guess (e.g. "असबी सरमा" -> "Asbi Sarma", "دریمہ آوستی" -> "Garima Awasthi") is far more useful than null, since the transliterated name is only ever checked against real, known records downstream — an imperfect guess that matches nothing real simply results in an honest "not found" answer, exactly as if you had returned null, so there is no harm in guessing. Only return null if the message truly names no person at all.

Valid intents: ${VALID_INTENTS.join(', ')}

JSON schema:
{
  "intents": string[],
  "entities": {
    "state": string|null, "region": string|null, "gi_required": boolean|null,
    "craft": string|null, "product_type": string|null, "artisan": string|null,
    "artisan_gender": "female"|"male"|null, "artisan_gender_mode": "required"|"preferred"|null,
    "min_price": number|null, "max_price": number|null,
    "target_price": number|null, "price_mode": "max"|"min"|"target"|null, "quantity": number|null,
    "gifting_purpose": string|null, "cultural_preference": string|null, "material": string|null,
    "colour": string|null, "size": string|null, "occasion": string|null,
    "traditional": boolean|null, "handmade": boolean|null
  }
}`

function historyToText(history: HistoryMessage[]): string {
  return history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
}

// Fields prone to a specific failure mode observed in testing: the LLM,
// given full conversation history, sometimes lifts a fact the ASSISTANT
// mentioned in a prior turn (a product's material, an artisan's name) and
// reports it back as if the user had just stated it. The system prompt
// tells the model not to do this, but prompt instructions are not a
// guarantee — this is a deterministic backstop. craft/state/price fields
// are deliberately NOT covered here: carrying those across turns from
// context is the intended multi-turn behavior (spec section 18), not a bug.
const GROUNDED_TEXT_FIELDS = [
  'artisan', 'material', 'colour', 'product_type', 'gifting_purpose', 'cultural_preference', 'occasion',
] as const satisfies readonly (keyof ExtractedEntities)[]

const HANDMADE_KEYWORDS = /handmade|hand-made|hand made|handcrafted|hand-crafted|artisanal/i
const TRADITIONAL_KEYWORDS = /traditional|heritage|authentic|age-old|time-honou?red/i
// "made by men" is a one-off policy question, not an ongoing shopping
// preference — unlike female (a real, sticky preference on this women-only
// platform, deliberately persisted across turns and covered by existing
// tests), male must NOT keep applying to every later turn once asked.
// Reproduced: with full conversation history in context, the query-
// understanding LLM itself re-extracted artisan_gender: "male" on later,
// completely unrelated turns (e.g. "What products does Madhya Pradesh
// have?") — not because that turn's text said anything about gender, but
// because "male" was still fresh in the conversation. Comparing against
// the LLM's own fresh extraction doesn't catch this (it re-asserted "male"
// too); only checking the actual CURRENT message text does, the same
// pattern groundInCurrentMessage already uses for handmade/traditional.
const MALE_GENDER_KEYWORDS = /\bmen\b|\bmale\b|पुरुष|आदमी|मर्द/i

// An explicit "show ALL products" (from the same state/craft already being
// discussed) is a request to drop prior narrowing filters, not just another
// refinement — but isTopicShift() only clears SHAPE_FIELDS when the anchor
// (state/craft/product_type) itself changes value, and re-stating the SAME
// state is not a change. Reproduced live: "leather related products from
// Madhya Pradesh" (material: leather) followed by "Show all products from
// madhya pradesh" kept material: "leather" stuck (state unchanged, so no
// topic shift, and this turn's extraction has material: null, which
// mergeEntities' null-doesn't-overwrite policy leaves untouched) — "all
// products" silently kept returning only the 5 leather items instead of
// every Madhya Pradesh product, and a later "how many products from
// Madhya Pradesh" inherited the same stale filter and undercounted.
const GENERIC_ALL_KEYWORDS =
  /\ball (products?|items?|types?)\b|\bany product\b|\beverything\b|सभी (उत्पाद|प्रोडक्ट्स?)|सारे (उत्पाद|प्रोडक्ट्स?)/i

// Explicit cross-state aggregate requests ("which states have products",
// "list products from every state") are a genuinely different scope than a
// single-state search and must not inherit a stale `state` from history —
// reproduced live: state stuck at "Delhi" (from an unrelated earlier turn)
// made "list all products from every state" silently answer about Delhi
// alone and falsely claim other states' data was unavailable, when the
// same conversation had already shown real Bihar/Madhya Pradesh products.
// This is a deterministic backstop (LLM intent/entity classification is not
// reliable enough alone — established elsewhere in this file/project).
// Regression: reproduced live — "how many products per state" was refused
// (the generic insufficient-information fallback) even though the exact
// same information was answered correctly seconds earlier by "which states
// have products?". \bhow many states\b only matches when "states" directly
// follows "how many" — "how many products per state" puts "products"
// between them, so the original pattern silently missed this ordinary
// rephrasing of the identical question.
const ALL_STATES_KEYWORDS =
  /\ball states\b|\bevery state\b|\beach state\b|\bwhich states\b|\bhow many states\b|\bproducts per state\b|\bper state\b|सभी राज्य|सारे (राज्य|स्टेट)|हर (राज्य|स्टेट)|कौन.?से (राज्य|स्टेट)/i

// "Which states" is generic enough to also match unrelated questions this
// feature has no data for — e.g. "what states does Kalastree ship to"
// (shipping/logistics, not product-availability). Regression caught by the
// eval suite: that question started returning the products-by-state
// breakdown instead of correctly refusing (no shipping data exists).
const SHIPPING_EXCLUSION = /\bship(ping|s)?\b|\bdeliver/i

export function isAllStatesRequest(question: string): boolean {
  return ALL_STATES_KEYWORDS.test(question) && !SHIPPING_EXCLUSION.test(question)
}

// Regression: reproduced live — "total how many products are there?" was
// refused (general_question, no evidence) even though the exact data
// needed (a per-state breakdown that sums to the grand total) was already
// being fetched correctly for "which states have products?". Reuses that
// same evidence rather than a new query — see pipeline.ts.
//
// Also matches "products from/in/across India" — reproduced live: after an
// earlier turn set state to a real Indian state/UT, "show all products
// from India" kept that stale state (GENERIC_ALL_KEYWORDS in mergeEntities
// deliberately does NOT clear `state` — "show all products from Madhya
// Pradesh" needs to KEEP the state while clearing material/craft — but
// "from India" isn't naming any specific state, it means nationwide, the
// same scope as "total products", just phrased with a country name).
const TOTAL_PRODUCTS_KEYWORDS =
  /\btotal\b[^?]*\bproducts?\b|\bproducts?\b[^?]*\btotal\b|\bhow many products (are there|do you have|do we have|in total)\b|\bnumber of products\b|\bproducts? (from|in|across|throughout) india\b|कुल (कितने|उत्पाद)|कितने उत्पाद (हैं|है)/i

export function isTotalProductsRequest(question: string): boolean {
  return TOTAL_PRODUCTS_KEYWORDS.test(question) && !SHIPPING_EXCLUSION.test(question)
}

// A follow-up like "show more" / "what else" only makes sense as "more
// beyond what I was just shown" — reproduced live: asking this after a
// truncated product list (correctly disclosed as "5 of 13") returned the
// SAME 5 products again verbatim, since ranking is deterministic and
// nothing tracked which ones the user had already seen. See pipeline.ts,
// which uses this to exclude previously-shown product ids from `ranked`
// before re-slicing, so this actually surfaces the next batch.
const SHOW_MORE_KEYWORDS =
  /^\s*(show )?more\s*$|\bshow me more\b|\bmore products\b|\bsee more\b|\bany more\b|\bwhat else\b|\bshow the rest\b|\bremaining products\b|\bnext (\d+|five|5)?\s*products?\b|और (दिखाओ|उत्पाद)|कुछ और/i

export function isShowMoreRequest(question: string): boolean {
  return SHOW_MORE_KEYWORDS.test(question)
}

// A bare "What is GI?" has no craft/product/state entity to anchor it, and
// reproduced live: the LLM classifies it as general_question rather than
// gi_information (no explicit rule told it otherwise, unlike
// kalastree_information's "What is Kalastree?" example above) — so it never
// reaches GI_DEFINITION_EVIDENCE (see pipeline.ts) and falls back to the
// generic insufficient-evidence refusal for the single most basic question a
// GI marketplace chatbot should answer. Same deterministic-backstop pattern
// as isAllStatesRequest above, since the LLM alone wasn't reliable here
// either. Safe to match broadly (including "what is GI status of Pashmina")
// since this only ADDS the intent — pipeline.ts still only injects the
// generic definition when verification comes back null, so a real
// craft-specific question is unaffected.
const GI_DEFINITION_KEYWORDS =
  /\bwhat(?:'s| is)\s+(a\s+)?gi\b|\bwhat does\s+gi\s+(mean|stand for)\b|\bwhat is\s+(a\s+)?geographical indication\b|\b(define|explain)\s+gi\b|\bmeaning of gi\b|जीआई\s*क्या है|भौगोलिक\s*संकेत\s*क्या है/i

export function isGIDefinitionRequest(question: string): boolean {
  return GI_DEFINITION_KEYWORDS.test(question)
}

// Only checks entities freshly extracted THIS turn — previously-merged
// values already passed this check in the turn they were extracted.
// Exported for direct unit testing (see queryUnderstanding.test.ts).
export function groundInCurrentMessage(extracted: ExtractedEntities, question: string): ExtractedEntities {
  const grounded = { ...extracted }
  const q = question.toLowerCase()

  for (const field of GROUNDED_TEXT_FIELDS) {
    const value = grounded[field]
    if (typeof value === 'string' && !q.includes(value.toLowerCase())) {
      grounded[field] = null as never
    }
  }
  if (grounded.handmade != null && !HANDMADE_KEYWORDS.test(q)) grounded.handmade = null
  if (grounded.traditional != null && !TRADITIONAL_KEYWORDS.test(q)) grounded.traditional = null

  return grounded
}

// Fields that describe the SHAPE of a product request. When the user's new
// message introduces a different craft or product_type than the previous
// turn had, the request has moved to a new topic — the OTHER shape fields
// from the old topic (e.g. "stole" from "any stole?") must not silently
// keep narrowing an unrelated new search (e.g. "what paintings are
// available?"). Reproduced in testing: dupatta -> stole -> paintings left// product_type: "stole" stuck on the paintings query. price/artisan_gender
// are NOT shape fields — carrying those across an actual topic change is
// still correct. state is also NOT in this list (a state pivot doesn't
// clear itself), but a state PIVOT does trigger the same clear — see
// isTopicShift below.
const SHAPE_FIELDS = [
  'craft', 'product_type', 'material', 'colour', 'occasion', 'gifting_purpose', 'cultural_preference',
] as const satisfies readonly (keyof ExtractedEntities)[]

// A state pivot (Bihar -> Madhya Pradesh, an explicit different value, not
// just adding a first-time state) is also a topic shift: reproduced in
// testing (Hindi) — "मधुबनी पेंटिंग" (craft=Madhubani Painting, Bihar) then
// "मध्य प्रदेश के क्या प्रोडक्ट्स हैं" (state=Madhya Pradesh, no craft
// restated) left craft: "Madhubani Painting" stuck, so the system silently
// searched for a Bihar-only craft inside an unrelated state and reported it
// as "not GI-registered" — factually wrong and not what was asked. Only
// fires when BOTH previous and extracted states are non-null and differ;
// first-time state assignment (previous.state === null) is an ordinary
// refinement (e.g. "show paintings" -> "from Bihar") and must not clear.
function isTopicShift(previous: ExtractedEntities, extracted: ExtractedEntities): boolean {
  const craftChanged = extracted.craft !== null && extracted.craft !== previous.craft
  const productTypeChanged = extracted.product_type !== null && extracted.product_type !== previous.product_type
  const stateChanged = extracted.state !== null && previous.state !== null && extracted.state !== previous.state
  return craftChanged || productTypeChanged || stateChanged
}

const ANCHOR_FIELDS = ['state', 'craft', 'product_type'] as const satisfies readonly (keyof ExtractedEntities)[]

// Fields that only make sense scoped to a specific anchored search (a
// state/craft/product_type). Reset when the conversation moves from a
// fully generic, anchor-less query straight to one that introduces its
// FIRST anchor — otherwise an old, unrelated modifier keeps silently
// applying to a completely different request. Reproduced: "show me
// anything under ₹100" (no anchor at all) followed by "products from
// Bihar made by a woman artisan" kept max_price: 100 stuck on the Bihar
// search, zeroing out real, in-budget results. Deliberately NOT triggered
// when `previous` already had an anchor (state/craft/product_type simply
// changing, e.g. stole -> paintings, is an ordinary refinement within the
// same shopping thread — see the topic-shift test for that case, where
// price/state correctly keep applying).
const MODIFIER_FIELDS = [
  'min_price', 'max_price', 'target_price', 'price_mode', 'gi_required',
] as const satisfies readonly (keyof ExtractedEntities)[]

function hasAnyAnchor(e: ExtractedEntities): boolean {
  return ANCHOR_FIELDS.some(f => e[f] !== null)
}

// `extracted` must already be normalized (see understandQuery) so its
// craft/state are compared like-for-like against `previous`, which was
// normalized in the turn it was extracted.
// Exported for direct unit testing (see queryUnderstanding.test.ts).
export function mergeEntities(previous: ExtractedEntities | null, extracted: ExtractedEntities, question = ''): ExtractedEntities {
  if (!previous) return extracted

  let base = previous
  if (isTopicShift(previous, extracted) || GENERIC_ALL_KEYWORDS.test(question)) {
    base = { ...base, ...Object.fromEntries(SHAPE_FIELDS.map(f => [f, null])) }
  }
  if (!hasAnyAnchor(previous) && hasAnyAnchor(extracted)) {
    base = { ...base, ...Object.fromEntries(MODIFIER_FIELDS.map(f => [f, null])) }
  }

  const merged = { ...base }
  for (const key of Object.keys(extracted) as (keyof ExtractedEntities)[]) {
    const value = extracted[key]
    if (value !== null && value !== undefined) merged[key] = value as never
  }
  return merged
}

// See the call site's doc comment (understandQuery, below) for why this
// exists as a separate, focused call rather than relying on the main
// extraction prompt's own transliteration instruction. Best-effort only —
// the returned name is still checked against real, known records
// downstream, so a wrong or overly-literal guess just results in an
// honest "not found" rather than a fabricated answer.
async function transliteratePersonName(question: string): Promise<string | null> {
  try {
    const raw = await callOpenAI(
      [
        {
          role: 'system',
          content:
            'The user is asking about a specific PERSON by name, in Hindi, Urdu, or another script, possibly with ' +
            'imperfect or phonetic spelling. Identify the person\'s name being asked about and respond with ONLY ' +
            'its best-effort Latin-script transliteration (e.g. "गरिमा अवस्थी" -> "Garima Awasthi"), no other text. ' +
            'If the message does not name any specific person, respond with exactly: NONE',
        },
        { role: 'user', content: question },
      ],
      { temperature: 0 }
    )
    const trimmed = raw.trim()
    return trimmed && trimmed.toUpperCase() !== 'NONE' ? trimmed : null
  } catch (err) {
    console.error('Person-name transliteration failed:', err)
    return null
  }
}

export async function understandQuery(
  question: string,
  history: HistoryMessage[],
  previousQuery: StructuredQuery | null
): Promise<StructuredQuery> {
  let intents: Intent[] = ['general_question']
  let entities: ExtractedEntities = EMPTY_ENTITIES

  try {
    const raw = await callOpenAI(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history.length ? [{ role: 'user' as const, content: `Conversation so far:\n${historyToText(history)}` }] : []),
        { role: 'user', content: question },
      ],
      { jsonMode: true, temperature: 0 }
    )
    const parsed = JSON.parse(raw)
    const parsedIntents = Array.isArray(parsed.intents)
      ? parsed.intents.filter((i: string): i is Intent => VALID_INTENTS.includes(i as Intent))
      : []
    intents = parsedIntents.length ? parsedIntents : ['general_question']
    entities = groundInCurrentMessage({ ...EMPTY_ENTITIES, ...(parsed.entities ?? {}) }, question)
  } catch (err) {
    console.error('Query understanding failed, falling back to general_question:', err)
  }

  // Normalize THIS turn's craft/state before merging (not after) — the
  // topic-shift check in mergeEntities compares craft against the previous
  // turn's already-normalized value, so both sides need to be in the same
  // canonical form or "Madhubani" vs. the previous turn's normalized
  // "Madhubani Painting" would wrongly look like a topic change.
  entities.craft = await normalizeCraft(entities.craft)
  entities.state = normalizeState(entities.state)

  // Deterministic backstop for when the LLM's own extraction misses a state
  // entirely — see scanForStateName's doc comment. Only fills a genuine gap
  // (entities.state was null); never overrides whatever the LLM did extract.
  if (!entities.state) {
    entities.state = scanForStateName(question)
  }

  // Same class of gap as scanForStateName above, but for person names: the
  // main extraction prompt (20+ competing rules plus a large JSON schema)
  // reliably fails to transliterate a person's name when it's written in a
  // non-Latin script (Devanagari, Urdu, etc.), even though the SAME model
  // transliterates it correctly when asked in an isolated, focused prompt.
  // Reproduced live: "गरिमा अवस्थी कौन है?" (clean, correct Devanagari for
  // "Garima Awasthi") returned entities.artisan: null from the main
  // extraction, and a plain-English sentence with the SAME name already in
  // Latin script ("Garima Awasthi कौन है?") extracted it fine — so this is
  // specific to non-Latin script in the name itself, not a general Hindi
  // gap. Only runs when actually needed (intent recognized as
  // artisan_information but no name extracted, and the question has
  // non-ASCII characters) — a second LLM call isn't worth paying for on
  // every request, only this specific, narrow gap.
  if (!entities.artisan && intents.includes('artisan_information') && /[^\x00-\x7F]/.test(question)) {
    entities.artisan = await transliteratePersonName(question)
  }

  const merged = mergeEntities(previousQuery?.entities ?? null, entities, question)

  // entities.artisan (the FRESH extraction, pre-merge) decides whether the
  // merged artisan should persist: if this turn isn't itself asking about
  // an artisan and didn't restate a name, drop whatever carried forward.
  // Reproduced: asking "who is Garima Awasthi" once, then every later,
  // unrelated turn kept entities.artisan = "Garima Awasthi" (mergeEntities
  // has no other reason to clear it), which kept wrongly triggering the
  // founder-evidence injection in pipeline.ts on plain product searches.
  if (!intents.includes('artisan_information') && entities.artisan === null) {
    merged.artisan = null
  }

  // See MALE_GENDER_KEYWORDS above — checks the actual message text, not
  // the LLM's own (unreliable, history-influenced) fresh extraction.
  if (merged.artisan_gender === 'male' && !MALE_GENDER_KEYWORDS.test(question)) {
    merged.artisan_gender = null
    merged.artisan_gender_mode = null
  }

  // Deterministic backstop: force-clear any stale state/region and route to
  // state_information regardless of what the LLM extracted this turn — see
  // isAllStatesRequest above.
  if (isAllStatesRequest(question)) {
    merged.state = null
    merged.region = null
    if (!intents.includes('state_information')) intents = [...intents, 'state_information']
  } else if (isTotalProductsRequest(question) && !entities.state) {
    // "Total how many products are there?" — a grand total across the
    // whole catalogue, not scoped to any one state. Checked BEFORE the
    // single-state backstop below, not after — reproduced live: asking
    // this right after a few Andaman-scoped turns left merged.state stuck
    // at "Andaman and Nicobar" from history, which made the single-state
    // branch's condition (merged.state is truthy) match FIRST and win,
    // silently narrowing "total" to Andaman's own count (0) instead of
    // ever reaching this branch to clear it. Clear any stale state (same
    // reasoning as isAllStatesRequest above) and route to state_information
    // so pipeline.ts's per-state breakdown evidence — which already sums to
    // the grand total — fires.
    //
    // `&& !entities.state` matters just as much as the reordering above —
    // reproduced live: "total how many product available from
    // andhrapradesh?" matches TOTAL_PRODUCTS_KEYWORDS ("total"..."product")
    // same as a genuine nationwide question would, but THIS turn's own
    // extraction (entities, pre-merge) found a real state — "total" here is
    // just emphasis on a single-state count, not a request to ignore the
    // state. Without this guard the branch cleared a state the user
    // explicitly named, and retrieval then ran with no state filter at all,
    // silently returning unrelated top-ranked products from a totally
    // different state as if they were relevant results.
    merged.state = null
    merged.region = null
    if (!intents.includes('state_information')) intents = [...intents, 'state_information']
  } else if (merged.state && intents.includes('state_information') && !intents.some(i => PRODUCT_INTENTS.includes(i))) {
    // A single-named-state question ("how many products from Rajasthan",
    // "products from Rajasthan") must stay product_discovery per the system
    // prompt rule above — but reproduced live: the LLM doesn't reliably
    // follow that for "how many" phrasing, classifying it as
    // state_information alone instead. state_information isn't in
    // PRODUCT_INTENTS (see pipeline.ts), so retrieval never runs at all —
    // not because there are no products, but because it never looked —
    // and the response generator, correctly refusing to guess a count with
    // no product evidence, falls back to the generic insufficient-
    // information refusal even though the exact same conversation had just
    // shown the real products moments earlier. Add product_discovery
    // alongside whatever the LLM picked, rather than replacing it, so any
    // other real intent it detected still gets its evidence too.
    intents = [...intents, 'product_discovery']
  }

  if (isGIDefinitionRequest(question) && !intents.includes('gi_information')) {
    intents = [...intents, 'gi_information']
  }

  return { raw_query: question, intents, entities: merged }
}
