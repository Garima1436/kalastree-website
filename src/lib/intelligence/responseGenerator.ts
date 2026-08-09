// Stage 9: Context builder + LLM response generation (spec sections 14-15).
//
// The LLM only ever sees the assembled, verified context below — it does
// not re-derive GI status, prices, or eligibility itself. The system
// prompt enforces the exact refusal string when evidence is insufficient.
import { callOpenAI } from './openai'
import type { Evidence, ExtractedEntities, RankedProduct, StructuredQuery, VerificationResult } from './types'

const FALLBACK_MESSAGE = 'The available verified Kalastree knowledge does not contain enough information to confirm this.'

const SYSTEM_PROMPT = `You are KalaStree AI, a GI (Geographical Indication) commerce assistant for an Indian marketplace of GI-verified women artisans.

You will be given: the user's question, a structured interpretation of it, verified facts, evidence, and (when relevant) already-ranked eligible products. All eligibility and ranking decisions have ALREADY been made by deterministic system logic — you are not deciding which products qualify, you are explaining the results in natural language.

Strict rules:
- Answer ONLY using the provided context. Never invent GI status, artisan identity, geographical origin, prices, availability, or sources.
- If the context does not contain enough information to answer, reply with exactly: "${FALLBACK_MESSAGE}"
- Never claim something is GI-verified unless the context marks it verification_status: "verified".
- When recommending products, briefly explain why each one matches (use the provided matched constraints / ranking reason) — do not restate raw JSON.
- Be concise, warm, and specific. Use short paragraphs or bullet points.
- Do not expose internal field names (e.g. "gi_verified", "score") — translate them into plain language.`

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
      ? `Eligible/ranked products:\n${formatProducts(ranked)}`
      : 'Eligible/ranked products: product search was not run for this query (not a product-discovery request) — do not claim products do or do not exist based on this; rely only on the Evidence section above for any product facts.',
  ].join('\n\n')
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

  let answer: string
  try {
    answer = await callOpenAI([
      { role: 'system', content: `${SYSTEM_PROMPT}\n\nContext:\n${finalContext}` },
      ...history.slice(-8).map(m => ({ role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text })),
      { role: 'user', content: question },
    ])
  } catch (err) {
    console.error('Response generation failed:', err)
    answer = FALLBACK_MESSAGE
  }

  const groundednessWarnings = findUngroundedPrices(answer, evidence, structuredQuery.entities)
  if (groundednessWarnings.length) console.warn('Groundedness check flagged:', groundednessWarnings)

  return { answer, finalContext, groundednessWarnings }
}
