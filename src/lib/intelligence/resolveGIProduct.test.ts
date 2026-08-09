import { describe, it, expect, vi } from 'vitest'
import { makeGIProduct } from './testFixtures'

const registry = [
  makeGIProduct({ id: 'gi-madhubani', name: 'Madhubani Painting', gi_tag: 'GI Tag No. 213', state: 'Bihar' }),
  makeGIProduct({ id: 'gi-bhagalpur', name: 'Bhagalpur Silk (Tussar)', gi_tag: 'GI Tag No. 174', state: 'Bihar' }),
]

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: () => ({ select: () => Promise.resolve({ data: registry }) }) },
}))

const { resolveGIProduct } = await import('./relationships')

describe('resolveGIProduct', () => {
  // Regression test: this used to build a raw PostgREST `.or()` filter
  // string by interpolating entities.craft directly. Parentheses have
  // special meaning in PostgREST's `or=` grouping syntax, so a craft name
  // like "Bhagalpur Silk (Tussar)" silently matched zero rows even though
  // it's a real, registered GI — caught by the eval harness (gi-02).
  it('resolves a GI whose name contains parentheses', async () => {
    const result = await resolveGIProduct({
      state: null, region: null, gi_required: null, craft: 'Bhagalpur Silk (Tussar)', product_type: null,
      artisan: null, artisan_gender: null, min_price: null, max_price: null, target_price: null,
      price_mode: null, quantity: null, gifting_purpose: null, cultural_preference: null, material: null,
      colour: null, size: null, occasion: null, traditional: null, handmade: null,
    })
    expect(result?.id).toBe('gi-bhagalpur')
  })

  it('resolves by exact craft name match', async () => {
    const result = await resolveGIProduct({
      state: null, region: null, gi_required: null, craft: 'Madhubani Painting', product_type: null,
      artisan: null, artisan_gender: null, min_price: null, max_price: null, target_price: null,
      price_mode: null, quantity: null, gifting_purpose: null, cultural_preference: null, material: null,
      colour: null, size: null, occasion: null, traditional: null, handmade: null,
    })
    expect(result?.id).toBe('gi-madhubani')
  })

  it('returns null for an unregistered craft', async () => {
    const result = await resolveGIProduct({
      state: null, region: null, gi_required: null, craft: 'Nonexistent Weaving', product_type: null,
      artisan: null, artisan_gender: null, min_price: null, max_price: null, target_price: null,
      price_mode: null, quantity: null, gifting_purpose: null, cultural_preference: null, material: null,
      colour: null, size: null, occasion: null, traditional: null, handmade: null,
    })
    expect(result).toBeNull()
  })
})
