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
