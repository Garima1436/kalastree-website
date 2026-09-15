import { describe, it, expect } from 'vitest'
import { isFounderName, KALASTREE_EVIDENCE, GI_DEFINITION_EVIDENCE, ORDER_RELATED_EVIDENCE, FOUNDER_NAME, CO_FOUNDER_NAME } from './kalastreeInfo'

describe('isFounderName', () => {
  it('matches the founder name case-insensitively', () => {
    expect(isFounderName('garima awasthi')).toBe(true)
    expect(isFounderName('Garima Awasthi')).toBe(true)
    expect(isFounderName('GARIMA AWASTHI')).toBe(true)
  })

  it('matches the co-founder name case-insensitively', () => {
    expect(isFounderName('manish rawat')).toBe(true)
    expect(isFounderName('Manish Rawat')).toBe(true)
    expect(isFounderName('MANISH RAWAT')).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(isFounderName('  Garima Awasthi  ')).toBe(true)
    expect(isFounderName('  Manish Rawat  ')).toBe(true)
  })

  it('matches a bare first name (whole word), not just the full name', () => {
    // Reproduced live: "who is manish?" fell through to an unrelated
    // artisan instead of ever reaching the co-founder, because this used
    // to require the exact full name. A bare first name must resolve.
    expect(isFounderName('Garima')).toBe(true)
    expect(isFounderName('garima')).toBe(true)
    expect(isFounderName('Manish')).toBe(true)
    expect(isFounderName('Rawat')).toBe(true)
  })

  it('does not match an unrelated name, even one sharing a substring', () => {
    expect(isFounderName('Sunita Jha')).toBe(false)
    // "manish" is a literal character-substring of "manisha" — must NOT
    // match via substring, only via a genuine whole-word match.
    expect(isFounderName('Manisha')).toBe(false)
    expect(isFounderName('Manisha Dhurve')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isFounderName(null)).toBe(false)
  })
})

describe('KALASTREE_EVIDENCE', () => {
  it('is non-empty and every entry is marked verified static evidence', () => {
    expect(KALASTREE_EVIDENCE.length).toBeGreaterThan(0)
    for (const e of KALASTREE_EVIDENCE) {
      expect(e.source_type).toBe('static')
      expect(e.verification_status).toBe('verified')
    }
  })

  it('includes the founder name in at least one entry', () => {
    expect(KALASTREE_EVIDENCE.some(e => e.retrieved_text.includes(FOUNDER_NAME))).toBe(true)
  })

  it('includes the co-founder name in at least one entry', () => {
    expect(KALASTREE_EVIDENCE.some(e => e.retrieved_text.includes(CO_FOUNDER_NAME))).toBe(true)
  })
})

describe('GI_DEFINITION_EVIDENCE', () => {
  it('is marked verified static evidence', () => {
    expect(GI_DEFINITION_EVIDENCE.source_type).toBe('static')
    expect(GI_DEFINITION_EVIDENCE.verification_status).toBe('verified')
  })

  it('actually defines what a GI is', () => {
    expect(GI_DEFINITION_EVIDENCE.retrieved_text).toMatch(/geographical origin/i)
    expect(GI_DEFINITION_EVIDENCE.retrieved_text).toMatch(/DPIIT/)
  })
})

describe('ORDER_RELATED_EVIDENCE', () => {
  it('is marked verified static evidence', () => {
    expect(ORDER_RELATED_EVIDENCE.source_type).toBe('static')
    expect(ORDER_RELATED_EVIDENCE.verification_status).toBe('verified')
  })

  it('points to the real My Orders page rather than fabricating order data', () => {
    expect(ORDER_RELATED_EVIDENCE.retrieved_text).toMatch(/account\/orders/)
    // Must not claim to know a specific order's status.
    expect(ORDER_RELATED_EVIDENCE.retrieved_text).not.toMatch(/shipped|delivered|processing|out for delivery/i)
  })
})
