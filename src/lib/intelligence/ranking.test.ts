import { describe, it, expect } from 'vitest'
import { rankProducts } from './ranking'
import { makeCandidate } from './testFixtures'
import type { EligibleProduct, ExtractedEntities } from './types'

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, min_price: null, max_price: null,
  target_price: null, price_mode: null, quantity: null, gifting_purpose: null,
  cultural_preference: null, material: null, colour: null, size: null, occasion: null,
  traditional: null, handmade: null,
}

function eligible(overrides: { id: string; price: number; matchedConstraints: string[]; giVerified: boolean }): EligibleProduct {
  return {
    product: makeCandidate({ id: overrides.id, price: overrides.price }),
    matchedConstraints: overrides.matchedConstraints,
    giVerification: {
      entity: 'x', gi_verified: overrides.giVerified, region: null, craft_category: null,
      source: null, source_confidence: null, verification_status: overrides.giVerified ? 'verified' : 'not_verified',
    },
  }
}

describe('rankProducts', () => {
  it('ranks a product matching more constraints above one matching fewer', () => {
    const strong = eligible({ id: 'strong', price: 1000, matchedConstraints: ['Bihar', 'GI verified', 'under ₹2000'], giVerified: true })
    const weak = eligible({ id: 'weak', price: 1000, matchedConstraints: ['under ₹2000'], giVerified: false })
    const ranked = rankProducts([weak, strong], EMPTY_ENTITIES, 3)
    expect(ranked[0].product.id).toBe('strong')
  })

  it('every ranking includes a breakdown that sums (via documented weights) to the reported score', () => {
    const item = eligible({ id: 'x', price: 1000, matchedConstraints: ['a'], giVerified: true })
    const [ranked] = rankProducts([item], EMPTY_ENTITIES, 1)
    const weightedSum =
      ranked.breakdown.semantic_relevance * 0.25 +
      ranked.breakdown.constraint_match * 0.30 +
      ranked.breakdown.gi_relevance * 0.20 +
      ranked.breakdown.cultural_relevance * 0.10 +
      ranked.breakdown.price_suitability * 0.10 +
      ranked.breakdown.availability * 0.05
    expect(ranked.score).toBeCloseTo(Math.round(weightedSum * 1000) / 1000, 3)
  })

  it('prices closer to a soft target_price score higher on price_suitability', () => {
    const near = eligible({ id: 'near', price: 1900, matchedConstraints: [], giVerified: false })
    const far = eligible({ id: 'far', price: 500, matchedConstraints: [], giVerified: false })
    const entities = { ...EMPTY_ENTITIES, target_price: 2000 }
    const ranked = rankProducts([near, far], entities, 0)
    const nearResult = ranked.find(r => r.product.id === 'near')!
    const farResult = ranked.find(r => r.product.id === 'far')!
    expect(nearResult.breakdown.price_suitability).toBeGreaterThan(farResult.breakdown.price_suitability)
  })

  it('always returns results sorted descending by score', () => {
    const items = [
      eligible({ id: 'a', price: 1000, matchedConstraints: [], giVerified: false }),
      eligible({ id: 'b', price: 1000, matchedConstraints: ['x', 'y'], giVerified: true }),
      eligible({ id: 'c', price: 1000, matchedConstraints: ['x'], giVerified: false }),
    ]
    const ranked = rankProducts(items, EMPTY_ENTITIES, 2)
    const scores = ranked.map(r => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })
})
