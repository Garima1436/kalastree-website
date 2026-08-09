import { describe, it, expect } from 'vitest'
import { findUngroundedPrices } from './responseGenerator'
import type { Evidence, ExtractedEntities } from './types'

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, min_price: null, max_price: null,
  target_price: null, price_mode: null, quantity: null, gifting_purpose: null,
  cultural_preference: null, material: null, colour: null, size: null, occasion: null,
  traditional: null, handmade: null,
}

function evidenceWithText(retrieved_text: string): Evidence[] {
  return [{
    source_id: 'x', source_type: 'database', source_title: 'x', source_reference: 'x',
    retrieved_text, relevance_score: 1, verification_status: 'verified',
  }]
}

describe('findUngroundedPrices', () => {
  it('flags a price that matches no evidence and no stated budget', () => {
    const warnings = findUngroundedPrices('This item costs ₹9999', evidenceWithText('₹2160'), EMPTY_ENTITIES)
    expect(warnings).toHaveLength(1)
  })

  it('does not flag a price present in evidence text', () => {
    const warnings = findUngroundedPrices('This stole is ₹2,160', evidenceWithText('Priced at ₹2160'), EMPTY_ENTITIES)
    expect(warnings).toHaveLength(0)
  })

  // Regression: caught by the eval harness (product-01) — the model
  // restating the user's own stated budget ("...which is under your
  // ₹3000 budget") was being flagged as an ungrounded/fabricated price,
  // when it's just an accurate echo of what the user said.
  it("does not flag the user's own stated max_price echoed back in the answer", () => {
    const entities = { ...EMPTY_ENTITIES, max_price: 3000 }
    const warnings = findUngroundedPrices('This is under ₹3000 as requested', evidenceWithText('₹2160'), entities)
    expect(warnings).toHaveLength(0)
  })

  it('does not flag a stated target_price echoed back', () => {
    const entities = { ...EMPTY_ENTITIES, target_price: 2500 }
    const warnings = findUngroundedPrices('This is close to your ₹2500 target', evidenceWithText('₹2160'), entities)
    expect(warnings).toHaveLength(0)
  })

  // Regression: caught by the eval harness (artisan-01) — an artisan's own
  // product-list evidence (not the product-discovery pipeline's `ranked`
  // output) was invisible to the old check, so real prices mentioned there
  // were flagged as fabricated.
  it('does not flag a price grounded in non-product evidence (e.g. an artisan\'s product list)', () => {
    const evidence = evidenceWithText('Surya Dev Painting — ₹8500; Silk Stole — ₹2160')
    const warnings = findUngroundedPrices('Her pieces include an ₹8500 painting and a ₹2160 stole', evidence, EMPTY_ENTITIES)
    expect(warnings).toHaveLength(0)
  })
})
