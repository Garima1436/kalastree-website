// Stage 7: Product ranking engine (spec section 11).
//
// Transparent, configurable weighted scoring over already-eligible products
// (eligibility.ts has already enforced every hard constraint — ranking only
// orders them). Every weight below is documented; nothing here is an
// opaque magic number.
import type { EligibleProduct, ExtractedEntities, RankedProduct, RankingBreakdown } from './types'

const WEIGHTS: RankingBreakdown = {
  // How well the free-text craft/product_type overlaps the product's
  // name/category — a lightweight keyword-overlap proxy for semantic
  // similarity (there's no product embedding index yet; see section 26 —
  // this is the simplest thing that works today without adding a new
  // vector index just for products).
  semantic_relevance: 0.25,
  // How many of the user's stated constraints (hard + soft) this product
  // actually satisfies — the single strongest ranking signal, since it
  // most directly reflects "did we answer what they asked for".
  constraint_match: 0.30,
  // GI authenticity is core to KalaStree's brand promise, so a verified GI
  // link is weighted above generic relevance signals.
  gi_relevance: 0.20,
  // Soft preference signals: traditional/handmade/gifting purpose/occasion.
  cultural_relevance: 0.10,
  // Closeness to a soft target price (only relevant when one was given).
  price_suitability: 0.10,
  // Stock presence — already hard-filtered by eligibility, kept as a small
  // tiebreaker rather than removed, in case stock becomes graded later
  // (e.g. "low stock" vs "well stocked").
  availability: 0.05,
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean))
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  let shared = 0
  for (const t of tokensA) if (tokensB.has(t)) shared++
  return shared / Math.max(tokensA.size, 1)
}

function scoreOne(item: EligibleProduct, entities: ExtractedEntities, totalConstraints: number): RankedProduct {
  const { product, matchedConstraints, giVerification } = item

  const queryText = [entities.craft, entities.product_type].filter(Boolean).join(' ')
  const semantic_relevance = queryText
    ? tokenOverlap(queryText, `${product.name} ${product.category} ${product.subcategory ?? ''}`)
    : 0.5

  const constraint_match = totalConstraints > 0 ? matchedConstraints.length / totalConstraints : 1

  const gi_relevance = giVerification?.gi_verified && product.gi_tag ? 1 : 0.3

  const culturalSignals = [entities.traditional, entities.handmade, entities.gifting_purpose, entities.occasion, entities.cultural_preference]
  const cultural_relevance = culturalSignals.some(Boolean) ? 0.8 : 0.5

  let price_suitability = 1
  if (entities.target_price != null) {
    price_suitability = Math.max(0, 1 - Math.abs(product.price - entities.target_price) / entities.target_price)
  }

  const availability = product.stock > 0 ? 1 : 0

  const breakdown: RankingBreakdown = {
    semantic_relevance, constraint_match, gi_relevance, cultural_relevance, price_suitability, availability,
  }

  const score =
    breakdown.semantic_relevance * WEIGHTS.semantic_relevance +
    breakdown.constraint_match * WEIGHTS.constraint_match +
    breakdown.gi_relevance * WEIGHTS.gi_relevance +
    breakdown.cultural_relevance * WEIGHTS.cultural_relevance +
    breakdown.price_suitability * WEIGHTS.price_suitability +
    breakdown.availability * WEIGHTS.availability

  const topFactor = (Object.entries(breakdown) as [keyof RankingBreakdown, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  const ranking_reason = matchedConstraints.length
    ? `Matches ${matchedConstraints.join(', ')}; strongest signal: ${topFactor.replace('_', ' ')}.`
    : `Ranked primarily on ${topFactor.replace('_', ' ')}.`

  return { ...item, score: Math.round(score * 1000) / 1000, breakdown, ranking_reason }
}

export function rankProducts(
  eligible: EligibleProduct[],
  entities: ExtractedEntities,
  totalConstraints: number
): RankedProduct[] {
  return eligible
    .map(item => scoreOne(item, entities, totalConstraints))
    .sort((a, b) => b.score - a.score)
}
