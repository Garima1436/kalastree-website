import { describe, it, expect } from 'vitest'
import { filterEligible } from './eligibility'
import { buildConstraints } from './constraints'
import { makeCandidate, makeGIProduct } from './testFixtures'
import type { StructuredQuery, ExtractedEntities } from './types'

function query(entities: Partial<ExtractedEntities>): StructuredQuery {
  const base: ExtractedEntities = {
    state: null, region: null, gi_required: null, craft: null, product_type: null,
    artisan: null, artisan_gender: null, artisan_gender_mode: null, min_price: null, max_price: null,
    target_price: null, price_mode: null, quantity: null, gifting_purpose: null,
    cultural_preference: null, material: null, colour: null, size: null, occasion: null,
    traditional: null, handmade: null,
  }
  return { raw_query: 'test', intents: ['product_discovery'], entities: { ...base, ...entities } }
}

describe('filterEligible', () => {
  // Mirrors the spec's own worked example (section 10): Bihar + GI +
  // female artisan + under ₹2,000 should keep only the matching product.
  const giRegistry = [makeGIProduct({ id: 'gi-madhubani', name: 'Madhubani Painting', gi_tag: 'GI Tag No. 213', state: 'Bihar' })]

  const productA = makeCandidate(
    { id: 'A', name: 'Madhubani Painting Tote', state: 'Bihar', price: 1500, stock: 5 },
    { craft: 'Madhubani Painting', state: 'Bihar' }
  )
  const productB = makeCandidate(
    { id: 'B', name: 'Generic Handicraft', state: 'Uttar Pradesh', price: 1800, stock: 5 },
    { craft: 'Chikankari', state: 'Uttar Pradesh' }
  )
  const productC = makeCandidate(
    { id: 'C', name: 'Madhubani Painting Frame', state: 'Bihar', price: 2500, stock: 5 },
    { craft: 'Madhubani Painting', state: 'Bihar' }
  )
  const outOfStock = makeCandidate(
    { id: 'D', name: 'Madhubani Painting Scroll', state: 'Bihar', price: 1200, stock: 0 },
    { craft: 'Madhubani Painting', state: 'Bihar' }
  )

  it('keeps only products satisfying every hard constraint (state + GI + price)', () => {
    const q = query({ state: 'Bihar', gi_required: true, max_price: 2000, price_mode: 'max' })
    const constraints = buildConstraints(q)
    const eligible = filterEligible([productA, productB, productC, outOfStock], constraints, giRegistry)
    expect(eligible.map(e => e.product.id)).toEqual(['A'])
  })

  it('rejects out-of-stock products even when every other constraint matches', () => {
    const q = query({ state: 'Bihar' })
    const constraints = buildConstraints(q)
    const eligible = filterEligible([outOfStock], constraints, giRegistry)
    expect(eligible).toHaveLength(0)
  })

  it('a soft constraint (target_price) never disqualifies a product', () => {
    const q = query({ state: 'Bihar', target_price: 500 }) // far from any product's price
    const constraints = buildConstraints(q)
    const eligible = filterEligible([productA, productC], constraints, giRegistry)
    expect(eligible.map(e => e.product.id).sort()).toEqual(['A', 'C'])
  })

  it('records per-product GI verification, not a single query-wide guess', () => {
    const q = query({})
    const constraints = buildConstraints(q)
    const eligible = filterEligible([productA, productB], constraints, giRegistry)
    const a = eligible.find(e => e.product.id === 'A')
    const b = eligible.find(e => e.product.id === 'B')
    expect(a?.giVerification?.gi_verified).toBe(true)
    expect(b?.giVerification?.gi_verified).toBe(false)
  })

  // Regression: reproduced live — "made by men" previously fell through to
  // a generic refusal instead of a confident, correct "no such products"
  // answer. Every artisan on this platform is a woman, so a male-artisan
  // request must deterministically reject every candidate.
  it('rejects every product when a male artisan is requested — no artisan on this platform is male', () => {
    const q = query({ artisan_gender: 'male' })
    const constraints = buildConstraints(q)
    expect(constraints.find(c => c.field === 'artisan_gender')).toMatchObject({ kind: 'hard', value: 'male' })
    const eligible = filterEligible([productA, productC], constraints, giRegistry)
    expect(eligible).toHaveLength(0)
  })
})
