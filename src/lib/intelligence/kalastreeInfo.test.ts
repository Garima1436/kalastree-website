import { describe, it, expect } from 'vitest'
import { isFounderName, KALASTREE_EVIDENCE, FOUNDER_NAME } from './kalastreeInfo'

describe('isFounderName', () => {
  it('matches the founder name case-insensitively', () => {
    expect(isFounderName('garima awasthi')).toBe(true)
    expect(isFounderName('Garima Awasthi')).toBe(true)
    expect(isFounderName('GARIMA AWASTHI')).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(isFounderName('  Garima Awasthi  ')).toBe(true)
  })

  it('does not match an unrelated or partial name', () => {
    expect(isFounderName('Garima')).toBe(false)
    expect(isFounderName('Sunita Jha')).toBe(false)
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
})
