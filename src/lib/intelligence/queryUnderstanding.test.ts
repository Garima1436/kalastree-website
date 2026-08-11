import { describe, it, expect } from 'vitest'
import { groundInCurrentMessage, mergeEntities, isAllStatesRequest } from './queryUnderstanding'
import type { ExtractedEntities } from './types'

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, artisan_gender_mode: null, min_price: null, max_price: null,
  target_price: null, price_mode: null, quantity: null, gifting_purpose: null,
  cultural_preference: null, material: null, colour: null, size: null, occasion: null,
  traditional: null, handmade: null,
}

describe('groundInCurrentMessage', () => {
  it('regression: nulls out an artisan name the model lifted from its own prior answer, not from the current user message', () => {
    // This is the exact failure observed in integration testing: after the
    // assistant mentioned "Sunita Jha" and "Tussar Silk" in a prior turn,
    // asking "only women artisans" caused the model to report those back
    // as freshly-stated entities.
    const extracted = { ...EMPTY_ENTITIES, artisan: 'Sunita Jha', material: 'Tussar Silk', artisan_gender: 'female' as const }
    const grounded = groundInCurrentMessage(extracted, 'only women artisans')
    expect(grounded.artisan).toBeNull()
    expect(grounded.material).toBeNull()
    // artisan_gender is a closed enum decided by the message itself, not a
    // free-text lift — legitimately kept.
    expect(grounded.artisan_gender).toBe('female')
  })

  it('keeps a text field when the current message actually contains it', () => {
    const extracted = { ...EMPTY_ENTITIES, material: 'silk' }
    expect(groundInCurrentMessage(extracted, 'I want something in silk').material).toBe('silk')
  })

  it('nulls handmade/traditional when the current message has no supporting keyword', () => {
    const extracted = { ...EMPTY_ENTITIES, handmade: true, traditional: true }
    const grounded = groundInCurrentMessage(extracted, 'only women artisans')
    expect(grounded.handmade).toBeNull()
    expect(grounded.traditional).toBeNull()
  })

  it('keeps handmade/traditional when the message supports them', () => {
    const extracted = { ...EMPTY_ENTITIES, handmade: true, traditional: true }
    const grounded = groundInCurrentMessage(extracted, 'a traditional, handmade gift')
    expect(grounded.handmade).toBe(true)
    expect(grounded.traditional).toBe(true)
  })

  it('does not touch craft/state/price fields — cross-turn carryover for those is intended behavior, not a bug', () => {
    const extracted = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', state: 'Bihar', max_price: 3000 }
    const grounded = groundInCurrentMessage(extracted, 'under 3000')
    expect(grounded.craft).toBe('Madhubani Painting')
    expect(grounded.state).toBe('Bihar')
    expect(grounded.max_price).toBe(3000)
  })
})

describe('mergeEntities', () => {
  it('carries forward craft/state/price for a genuine refinement (no new craft/product_type stated)', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', state: 'Bihar' }
    const extracted = { ...EMPTY_ENTITIES, max_price: 3000 }
    const merged = mergeEntities(previous, extracted)
    expect(merged.craft).toBe('Madhubani Painting')
    expect(merged.state).toBe('Bihar')
    expect(merged.max_price).toBe(3000)
  })

  // Regression: reproduced against the live pipeline as
  // dupatta -> stole -> paintings. "stole" (product_type) stuck around into
  // an unrelated later question about paintings, silently narrowing it.
  it('clears the OTHER shape fields when the new turn introduces a different product_type', () => {
    const previous = { ...EMPTY_ENTITIES, product_type: 'stole', material: 'silk' }
    const extracted = { ...EMPTY_ENTITIES, product_type: 'paintings' }
    const merged = mergeEntities(previous, extracted)
    expect(merged.product_type).toBe('paintings')
    expect(merged.material).toBeNull()
  })

  it('clears the OTHER shape fields when the new turn introduces a different craft', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Bhagalpur Silk', product_type: 'saree', occasion: 'wedding' }
    const extracted = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting' }
    const merged = mergeEntities(previous, extracted)
    expect(merged.craft).toBe('Madhubani Painting')
    expect(merged.product_type).toBeNull()
    expect(merged.occasion).toBeNull()
  })

  it('does NOT clear shape fields when craft/product_type simply repeat the same value', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', material: 'Tussar Silk' }
    const extracted = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', max_price: 3000 }
    const merged = mergeEntities(previous, extracted)
    expect(merged.craft).toBe('Madhubani Painting')
    expect(merged.material).toBe('Tussar Silk')
    expect(merged.max_price).toBe(3000)
  })

  it('does not treat a topic shift as clearing state/price — those persist across an actual topic change', () => {
    const previous = { ...EMPTY_ENTITIES, product_type: 'stole', state: 'Bihar', max_price: 3000 }
    const extracted = { ...EMPTY_ENTITIES, product_type: 'paintings' }
    const merged = mergeEntities(previous, extracted)
    expect(merged.state).toBe('Bihar')
    expect(merged.max_price).toBe(3000)
  })

  // Regression: reproduced live on kalastree.com — "show me anything under
  // ₹100" (no anchor at all) followed by "products from Bihar made by a
  // woman artisan" kept max_price: 100 stuck on the Bihar search, silently
  // zeroing out two real, in-budget products.
  it('clears price/gi_required when a fully generic (anchor-less) turn is followed by one that introduces the first anchor', () => {
    const previous = { ...EMPTY_ENTITIES, max_price: 100, price_mode: 'max' as const, gi_required: true }
    const extracted = { ...EMPTY_ENTITIES, state: 'Bihar', artisan_gender: 'female' as const, artisan_gender_mode: 'required' as const }
    const merged = mergeEntities(previous, extracted)
    expect(merged.state).toBe('Bihar')
    expect(merged.max_price).toBeNull()
    expect(merged.price_mode).toBeNull()
    expect(merged.gi_required).toBeNull()
  })

  it('does NOT clear price when the previous turn already had an anchor (ordinary refinement, not a fresh request)', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', max_price: 3000 }
    const extracted = { ...EMPTY_ENTITIES, state: 'Bihar' }
    const merged = mergeEntities(previous, extracted)
    expect(merged.max_price).toBe(3000)
  })

  // Regression: reproduced live (Hindi) — "मुझे मधुबनी पेंटिंग के बारे में
  // बताओ" (craft=Madhubani Painting) -> "बिहार से..." (state=Bihar) ->
  // "मध्य प्रदेश के क्या प्रोडक्ट्स हैं" (state=Madhya Pradesh, no craft
  // restated) left craft: "Madhubani Painting" stuck, so the system silently
  // searched for a Bihar-only craft inside an unrelated state and reported
  // it as "not GI-registered" instead of answering what was actually asked.
  it('clears the OTHER shape fields when the new turn pivots to a different, already-anchored state', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', state: 'Bihar', material: 'silk' }
    const extracted = { ...EMPTY_ENTITIES, state: 'Madhya Pradesh' }
    const merged = mergeEntities(previous, extracted)
    expect(merged.state).toBe('Madhya Pradesh')
    expect(merged.craft).toBeNull()
    expect(merged.material).toBeNull()
  })

  it('does NOT clear shape fields when state simply repeats the same value', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting', state: 'Bihar' }
    const extracted = { ...EMPTY_ENTITIES, state: 'Bihar', max_price: 3000 }
    const merged = mergeEntities(previous, extracted)
    expect(merged.craft).toBe('Madhubani Painting')
    expect(merged.state).toBe('Bihar')
  })

  it('does NOT clear shape fields when state is introduced for the first time (previous had none)', () => {
    const previous = { ...EMPTY_ENTITIES, craft: 'Madhubani Painting' }
    const extracted = { ...EMPTY_ENTITIES, state: 'Bihar' }
    const merged = mergeEntities(previous, extracted)
    expect(merged.craft).toBe('Madhubani Painting')
    expect(merged.state).toBe('Bihar')
  })
})

describe('isAllStatesRequest', () => {
  it('detects English aggregate phrasing', () => {
    expect(isAllStatesRequest('which states have products?')).toBe(true)
    expect(isAllStatesRequest('list products from every state')).toBe(true)
    expect(isAllStatesRequest('show me all states products')).toBe(true)
  })

  it('detects Hindi aggregate phrasing', () => {
    expect(isAllStatesRequest('सारे स्टेट्स के जितने भी प्रोडक्ट्स हैं, उनको लिस्ट करके दिखाएं।')).toBe(true)
    expect(isAllStatesRequest('कौन से स्टेट्स के कितने प्रोडक्ट्स आपके पास अविलेबल हैं?')).toBe(true)
  })

  it('does not misfire on an ordinary single-state question', () => {
    expect(isAllStatesRequest('Show me products from Bihar')).toBe(false)
    expect(isAllStatesRequest('बिहार से क्या प्रोडक्ट्स हैं')).toBe(false)
  })

  // Regression: "which states" is generic enough to also match an unrelated
  // shipping/logistics question, which this feature has no data for and
  // must not silently answer with a products-by-state breakdown instead of
  // the correct refusal.
  it('does not misfire on a shipping/logistics question that happens to mention states', () => {
    expect(isAllStatesRequest('What states does Kalastree ship to?')).toBe(false)
    expect(isAllStatesRequest('Which states do you deliver to?')).toBe(false)
  })
})
