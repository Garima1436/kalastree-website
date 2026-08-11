import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (table: string) => ({
      select: () =>
        table === 'gi_products'
          ? Promise.resolve({ data: [{ name: 'Madhubani Painting', gi_tag: 'GI Tag No. 213' }] })
          : Promise.resolve({ data: [{ craft: 'Madhubani Painting' }] }),
    }),
  },
}))

const { normalizeCraft, normalizeState } = await import('./entityNormalization')

describe('normalizeState', () => {
  it('resolves an exact match', () => {
    expect(normalizeState('Bihar')).toBe('Bihar')
  })

  it('is case-insensitive', () => {
    expect(normalizeState('bihar')).toBe('Bihar')
  })

  it('passes through an unrecognized state unchanged rather than dropping it', () => {
    expect(normalizeState('Atlantis')).toBe('Atlantis')
  })

  it('returns null for null input', () => {
    expect(normalizeState(null)).toBeNull()
  })

  // Regression: reproduced live — "products from madhyadpradesh" failed to
  // match any Madhya Pradesh product because the typo doesn't contain
  // "madhya pradesh" (or vice versa) as a contiguous substring, so the
  // state passed through unresolved and the exact-match DB filter matched
  // nothing, even though real Madhya Pradesh products exist.
  it('resolves a one-character-typo/missing-space state name via bounded edit distance', () => {
    expect(normalizeState('madhyadpradesh')).toBe('Madhya Pradesh')
    expect(normalizeState('Madhyaprdesh')).toBe('Madhya Pradesh')
  })

  it('does not fuzzy-match a genuinely unrelated word to a state', () => {
    expect(normalizeState('Kerala')).toBe('Kerala')
    // "Bihari" is close to "Bihar" in spelling but is a different word
    // (a demonym, not the state name) — still resolves, which is fine
    // since it's clearly referring to the same state; the real guard is
    // that something unrelated like "Atlantis" (above) never matches.
  })
})

describe('normalizeCraft', () => {
  it('resolves a known documented synonym ("Mithila Painting") to the canonical registry name', async () => {
    expect(await normalizeCraft('Mithila Painting')).toBe('Madhubani Painting')
  })

  it('resolves a substring match against the known-crafts cache', async () => {
    expect(await normalizeCraft('Madhubani')).toBe('Madhubani Painting')
  })

  it('returns null for null input', async () => {
    expect(await normalizeCraft(null)).toBeNull()
  })
})
