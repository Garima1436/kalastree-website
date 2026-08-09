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
]

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, min_price: null, max_price: null,
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
- Conversation history is provided ONLY to resolve what the user's latest message refers back to (e.g. "under 3000" after "show me Madhubani paintings" means craft=Madhubani Painting, max_price=3000). Extract entities ONLY from words the USER actually wrote across their own turns. NEVER pull a value from the assistant's prior replies (product names, artisan names, materials, prices it mentioned) unless the user's own message repeats or confirms it themselves — the assistant's answers are not user-stated facts.

Valid intents: ${VALID_INTENTS.join(', ')}

JSON schema:
{
  "intents": string[],
  "entities": {
    "state": string|null, "region": string|null, "gi_required": boolean|null,
    "craft": string|null, "product_type": string|null, "artisan": string|null,
    "artisan_gender": "female"|"male"|null, "min_price": number|null, "max_price": number|null,
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

function mergeEntities(previous: ExtractedEntities | null, extracted: ExtractedEntities): ExtractedEntities {
  if (!previous) return extracted
  const merged = { ...previous }
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

  const merged = mergeEntities(previousQuery?.entities ?? null, entities)
  merged.craft = await normalizeCraft(merged.craft)
  merged.state = normalizeState(merged.state)

  return { raw_query: question, intents, entities: merged }
}
