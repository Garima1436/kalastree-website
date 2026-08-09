import { describe, it, expect } from 'vitest'
import { groundInCurrentMessage } from './queryUnderstanding'
import type { ExtractedEntities } from './types'

const EMPTY_ENTITIES: ExtractedEntities = {
  state: null, region: null, gi_required: null, craft: null, product_type: null,
  artisan: null, artisan_gender: null, min_price: null, max_price: null,
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
