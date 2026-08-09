// Shared fixture builders for pipeline unit tests. Not a *.test.ts file
// itself, so vitest won't try to run it as a test suite.
import type { Artisan, GIProduct, Product } from '@/lib/types'
import type { CandidateProduct } from './types'

export function makeGIProduct(overrides: Partial<GIProduct> = {}): GIProduct {
  return {
    id: 'gi-1', name: 'Madhubani Painting', name_hi: null, state: 'Bihar', gi_tag: 'GI Tag No. 213',
    year: '2007', category: 'handicraft', accent: '#E8380A', emoji: '🎨', tagline: 'tagline',
    tagline_hi: null, women_role: 'primary creators', women_role_hi: null, history: 'history text',
    history_hi: null, materials: 'natural dyes', materials_hi: null, district: 'Madhubani',
    women_percent: 90, image_url: null, created_at: '2026-01-01',
    ...overrides,
  }
}

export function makeArtisan(overrides: Partial<Artisan> = {}): Artisan {
  return {
    id: 'artisan-1', name: 'Sunita Jha', slug: 'sunita-jha', photo_url: null, state: 'Bihar',
    craft: 'Madhubani Painting', gi_product: 'Madhubani Painting', gi_product_id: null,
    story: null, bio: null, is_verified: true, is_featured: false, user_id: null,
    created_at: '2026-01-01',
    ...overrides,
  }
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1', artisan_id: 'artisan-1', name: 'Madhubani Hand-Painted Silk Stole',
    name_hi: null, slug: 'madhubani-stole', description: null, description_hi: null,
    price: 2160, images: [], gi_tag: null, gi_product_id: null, category: 'textile',
    subcategory: null, state: 'Bihar', stock: 10, is_featured: false, cod_available: true,
    created_at: '2026-01-01',
    ...overrides,
  }
}

export function makeCandidate(
  productOverrides: Partial<Product> = {},
  artisanOverrides: Partial<Artisan> = {}
): CandidateProduct {
  return { ...makeProduct(productOverrides), artisan: makeArtisan(artisanOverrides) }
}
