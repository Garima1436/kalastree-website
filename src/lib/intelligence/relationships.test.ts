import { describe, it, expect } from 'vitest'
import { matchesGIRegistry } from './relationships'
import { makeGIProduct, makeProduct } from './testFixtures'

describe('matchesGIRegistry', () => {
  const madhubani = makeGIProduct({ id: 'gi-madhubani', name: 'Madhubani Painting', gi_tag: 'GI Tag No. 213', state: 'Bihar' })
  const bhagalpur = makeGIProduct({ id: 'gi-bhagalpur', name: 'Bhagalpur Silk', gi_tag: 'GI Tag No. 174', state: 'Bihar' })
  const registry = [madhubani, bhagalpur]

  it('prefers the real FK when set', () => {
    const product = makeProduct({ gi_product_id: 'gi-bhagalpur', gi_tag: null })
    expect(matchesGIRegistry(product, registry)?.id).toBe('gi-bhagalpur')
  })

  it('matches on an exact gi_tag when the FK is absent', () => {
    const product = makeProduct({ gi_product_id: null, gi_tag: 'GI Tag No. 174' })
    expect(matchesGIRegistry(product, registry)?.id).toBe('gi-bhagalpur')
  })

  it('falls back to the name-token heuristic when neither FK nor gi_tag is set — the real-world case, since products.gi_tag is unpopulated in production', () => {
    const product = makeProduct({
      gi_product_id: null, gi_tag: null, state: 'Bihar',
      name: 'Madhubani Hand-Painted Tussar Silk Stole/dupatta', category: 'textile',
    })
    expect(matchesGIRegistry(product, registry)?.id).toBe('gi-madhubani')
  })

  it('the name-token heuristic also checks the joined artisan.craft field, not just the product name', () => {
    const product = makeProduct({ gi_product_id: null, gi_tag: null, state: 'Bihar', name: 'Plain Silk Stole', category: 'textile' })
    const withArtisanCraft = { ...product, artisan: { craft: 'Madhubani Painting' } }
    expect(matchesGIRegistry(withArtisanCraft, registry)?.id).toBe('gi-madhubani')
  })

  it('does not match a product to a GI from a different state, even with an identical craft keyword', () => {
    const product = makeProduct({ gi_product_id: null, gi_tag: null, state: 'West Bengal', name: 'Madhubani-style print' })
    expect(matchesGIRegistry(product, registry)).toBeNull()
  })

  it('returns null when nothing matches', () => {
    const product = makeProduct({ gi_product_id: null, gi_tag: null, state: 'Bihar', name: 'Generic Bamboo Basket', category: 'handicraft' })
    expect(matchesGIRegistry(product, registry)).toBeNull()
  })
})
