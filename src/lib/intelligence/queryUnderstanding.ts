// Stage 1: Intent + entity extraction (spec sections 3-5, 18).
//
// This is the ONLY place the LLM is asked to interpret the raw user
// message into structure. It must not be asked to decide anything
// consequential (GI status, prices, eligibility) — those are deterministic
// stages downstream. If extraction fails or returns malformed JSON, we fall
// back to an empty structured query rather than guessing.
import { callOpenAI } from './openai'
import { normalizeCraft, normalizeState } from './entityNormalization'
import type { StructuredQuery, ExtractedEntities, Intent } from './types'

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
- source_inquiry is for a follow-up asking where a PRIOR claim came from — "where did you get that", "what's your source for X", "how do you know that", "where is that from". Use it only when the user is asking about the origin of something already said in this conversation, not when asking a new factual question.

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
// available?"). Reproduced in testing: dupatta -> stole -> paintings left
// product_type: "stole" stuck on the paintings query. state/price/
// artisan_gender are NOT shape fields — carrying those across an actual
// topic change is still correct (e.g. "Bihar" should keep applying).
const SHAPE_FIELDS = [
  'craft', 'product_type', 'material', 'colour', 'occasion', 'gifting_purpose', 'cultural_preference',
] as const satisfies readonly (keyof ExtractedEntities)[]

function isTopicShift(previous: ExtractedEntities, extracted: ExtractedEntities): boolean {
  const craftChanged = extracted.craft !== null && extracted.craft !== previous.craft
  const productTypeChanged = extracted.product_type !== null && extracted.product_type !== previous.product_type
  return craftChanged || productTypeChanged
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
export function mergeEntities(previous: ExtractedEntities | null, extracted: ExtractedEntities): ExtractedEntities {
  if (!previous) return extracted

  let base = previous
  if (isTopicShift(previous, extracted)) {
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

  const merged = mergeEntities(previousQuery?.entities ?? null, entities)

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

  return { raw_query: question, intents, entities: merged }
}
