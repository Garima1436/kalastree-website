import { describe, it, expect } from 'vitest'
import { findUngroundedPrices, generateResponse } from './responseGenerator'
import type { Evidence, ExtractedEntities, StructuredQuery } from './types'

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, artisan_gender_mode: null, min_price: null, max_price: null,
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

describe('generateResponse — male-artisan deterministic short-circuit', () => {
  // Regression: reproduced live — "made by men", asked right after a
  // confident product listing for women artisans, consistently (4/4 runs)
  // got the generic insufficient-evidence refusal from the LLM despite the
  // correct fact being right there in evidence — even after strengthening
  // the prompt to explicitly say "use this evidence confidently." Since
  // this fact never varies by query (every artisan on the platform is a
  // woman), it's answered deterministically instead of trusting the LLM —
  // this test verifies that path never reaches the network (no API key set
  // here; if it fell through to callOpenAI, the test would fail/throw).
  const structuredQuery: StructuredQuery = {
    raw_query: 'made by men',
    intents: ['general_question'],
    entities: { ...EMPTY_ENTITIES, artisan_gender: 'male' },
  }

  it('answers directly from the women-only-platform evidence without calling the LLM', async () => {
    const evidence: Evidence[] = [{
      source_id: 'static:women-only-platform',
      source_type: 'static',
      source_title: 'KalaStree Artisan Policy',
      source_reference: 'x',
      retrieved_text: 'KalaStree exclusively features women artisans. There are no male artisans.',
      relevance_score: 1,
      verification_status: 'verified',
    }]
    const result = await generateResponse('made by men', structuredQuery, null, evidence, [], [], false)
    expect(result.answer).toBe('KalaStree exclusively features women artisans. There are no male artisans.')
    expect(result.groundednessWarnings).toEqual([])
  })

  it('falls back to a hardcoded default if the evidence entry is somehow missing', async () => {
    const result = await generateResponse('made by men', structuredQuery, null, [], [], [], false)
    expect(result.answer).toContain('women artisans')
  })
})
