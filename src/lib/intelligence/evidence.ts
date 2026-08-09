// Stage 8: Evidence assembly (spec section 8).
//
// Merges deterministic database facts (GI verification, ranked products)
// and narrative corpus chunks (from the Python backend) into one evidence
// list with consistent metadata. This is what gets handed to the LLM as
// its ONLY source of truth for the final answer.
import type { Evidence, NarrativeChunk, RankedProduct, VerificationResult } from './types'

export function buildEvidence(
  verification: VerificationResult | null,
  ranked: RankedProduct[],
  narrative: NarrativeChunk[]
): Evidence[] {
  const evidence: Evidence[] = []

  if (verification?.gi_product) {
    const gp = verification.gi_product
    evidence.push({
      source_id: `gi_products:${gp.id}`,
      source_type: 'database',
      source_title: `${gp.name} — KalaStree GI Registry`,
      source_reference: `gi_products.id=${gp.id}`,
      retrieved_text: `${gp.name} (GI tag ${gp.gi_tag}, registered ${gp.year}, ${gp.state}). ${gp.tagline} ${gp.history}`.trim(),
      relevance_score: 1,
      verification_status: 'verified',
    })
  } else if (verification) {
    evidence.push({
      source_id: `verification:${verification.entity}`,
      source_type: 'database',
      source_title: 'GI Verification Check',
      source_reference: 'gi_products lookup (no match)',
      retrieved_text: `"${verification.entity}" was not found in the verified GI registry.`,
      relevance_score: 1,
      verification_status: 'not_verified',
    })
  }

  ranked.slice(0, 5).forEach(r => {
    evidence.push({
      source_id: `products:${r.product.id}`,
      source_type: 'database',
      source_title: r.product.name,
      source_reference: `products.id=${r.product.id}`,
      retrieved_text: `${r.product.name} — ₹${r.product.price}, by ${r.product.artisan?.name ?? 'unknown artisan'}, ${r.product.state ?? 'state unknown'}. Stock: ${r.product.stock}.`,
      relevance_score: r.score,
      verification_status: r.giVerification?.gi_verified ? 'verified' : 'not_verified',
    })
  })

  narrative.forEach((chunk, i) => {
    evidence.push({
      source_id: `corpus:${i}:${chunk.source}`,
      source_type: 'research_corpus',
      source_title: chunk.source,
      source_reference: chunk.source,
      retrieved_text: chunk.content,
      relevance_score: chunk.score,
      verification_status: 'unverified_corpus',
    })
  })

  return evidence
}
