import { describe, it, expect } from 'vitest'
import { buildConstraints, hardConstraints, softConstraints } from './constraints'
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

describe('buildConstraints', () => {
  it('always includes availability as a hard constraint', () => {
    const constraints = buildConstraints(query({}))
    expect(constraints.some(c => c.field === 'availability' && c.kind === 'hard')).toBe(true)
  })

  it('treats "under X" (price_mode: max) as a hard max_price constraint', () => {
    const constraints = buildConstraints(query({ max_price: 2000, price_mode: 'max' }))
    const maxConstraint = constraints.find(c => c.field === 'max_price')
    expect(maxConstraint?.kind).toBe('hard')
    expect(maxConstraint?.value).toBe(2000)
  })

  it('treats "around X" (price_mode: target) as a soft target_price constraint, not a hard max', () => {
    const constraints = buildConstraints(query({ max_price: 2500, price_mode: 'target' }))
    expect(constraints.find(c => c.field === 'max_price')).toBeUndefined()
    const target = constraints.find(c => c.field === 'target_price')
    expect(target?.kind).toBe('soft')
    expect(target?.value).toBe(2500)
  })

  it('makes state and gi_required hard constraints when present', () => {
    const constraints = buildConstraints(query({ state: 'Bihar', gi_required: true }))
    expect(constraints.find(c => c.field === 'state')).toMatchObject({ kind: 'hard', value: 'Bihar' })
    expect(constraints.find(c => c.field === 'gi_verified')).toMatchObject({ kind: 'hard', value: true })
  })

  // Every artisan on the platform is a woman, so this constraint never
  // actually filters anything out either way — but its `kind` still needs
  // to honestly reflect how firmly the user stated it, for
  // matched_constraints/explainability and in case that ever changes.
  it('treats a firm statement ("made by a woman artisan", "only women artisans") as HARD', () => {
    const constraints = buildConstraints(query({ artisan_gender: 'female', artisan_gender_mode: 'required' }))
    expect(constraints.find(c => c.field === 'artisan_gender')?.kind).toBe('hard')
  })

  it('defaults to HARD when the mode is unspecified — unhedged mentions are the common case', () => {
    const constraints = buildConstraints(query({ artisan_gender: 'female', artisan_gender_mode: null }))
    expect(constraints.find(c => c.field === 'artisan_gender')?.kind).toBe('hard')
  })

  it('treats an explicitly hedged preference ("I prefer...", "preferably...") as SOFT', () => {
    const constraints = buildConstraints(query({ artisan_gender: 'female', artisan_gender_mode: 'preferred' }))
    expect(constraints.find(c => c.field === 'artisan_gender')?.kind).toBe('soft')
  })

  it('omits price constraints entirely when no price was mentioned', () => {
    const constraints = buildConstraints(query({}))
    expect(constraints.find(c => c.field === 'max_price' || c.field === 'target_price' || c.field === 'min_price')).toBeUndefined()
  })

  it('hardConstraints/softConstraints correctly partition the list', () => {
    const constraints = buildConstraints(query({ state: 'Bihar', target_price: 2500 }))
    expect(hardConstraints(constraints).every(c => c.kind === 'hard')).toBe(true)
    expect(softConstraints(constraints).every(c => c.kind === 'soft')).toBe(true)
    expect(hardConstraints(constraints).length + softConstraints(constraints).length).toBe(constraints.length)
  })
})
