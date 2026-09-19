import { describe, it, expect } from 'vitest'
import { slugify, openingPath, relativePosted, employmentTypeLabels, jobRef, roleWithRef } from './careers'
import { parseOpeningId } from './careersValidation'

const ID = '9139d2aa-1440-4590-8630-7dcb85f7cae6'

describe('slugify', () => {
  it('makes a readable lowercase slug', () => {
    expect(slugify('Marketing Intern')).toBe('marketing-intern')
    expect(slugify('  Sales & Business Development (Remote)!  ')).toBe('sales-business-development-remote')
  })
  it('collapses repeated separators and trims hyphens', () => {
    expect(slugify('a --- b___c')).toBe('a-b-c')
    expect(slugify('--edge--')).toBe('edge')
  })
  it('caps the length', () => {
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(60)
  })
  it('returns an empty string when nothing usable is left', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('मार्केटिंग')).toBe('')
  })
})

describe('openingPath / parseOpeningId', () => {
  it('builds a readable path that parses back to the same id', () => {
    const path = openingPath({ id: ID, title: 'Marketing Intern' })
    expect(path).toBe(`/careers/marketing-intern-${ID}`)
    expect(parseOpeningId(path.replace('/careers/', ''))).toBe(ID)
  })
  it('falls back to "position" when the title has no usable characters', () => {
    expect(openingPath({ id: ID, title: '!!!' })).toBe(`/careers/position-${ID}`)
  })
  it('still resolves when the title part is stale or wrong (only the id matters)', () => {
    expect(parseOpeningId(`old-title-before-edit-${ID}`)).toBe(ID)
    expect(parseOpeningId(ID)).toBe(ID)
  })
  it('rejects anything that does not end in a well-formed uuid', () => {
    expect(parseOpeningId('marketing-intern')).toBeNull()
    expect(parseOpeningId(`${ID}-extra`)).toBeNull()
    expect(parseOpeningId(`x-${ID.slice(0, 35)}`)).toBeNull()
    expect(parseOpeningId("1'; drop table job_openings;--")).toBeNull()
    expect(parseOpeningId('')).toBeNull()
  })
})

describe('relativePosted', () => {
  const now = new Date('2026-09-19T12:00:00Z').getTime()
  const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString()

  it('says today / yesterday / N days ago in English', () => {
    expect(relativePosted(daysAgo(0), 'en', now)).toBe('today')
    expect(relativePosted(daysAgo(1), 'en', now)).toBe('yesterday')
    expect(relativePosted(daysAgo(5), 'en', now)).toBe('5 days ago')
  })
  it('switches to a plain date after 30 days', () => {
    expect(relativePosted(daysAgo(29), 'en', now)).toBe('29 days ago')
    expect(relativePosted(daysAgo(45), 'en', now)).toMatch(/2026/)
    expect(relativePosted(daysAgo(45), 'en', now)).not.toMatch(/ago/)
  })
  it('never reports a negative age for a timestamp slightly in the future', () => {
    expect(relativePosted(new Date(now + 3_600_000).toISOString(), 'en', now)).toBe('today')
  })
  it('produces Devanagari text for Hindi', () => {
    expect(relativePosted(daysAgo(5), 'hi', now)).toMatch(/[ऀ-ॿ]/)
  })
})

describe('employmentTypeLabels', () => {
  it('maps every employment type through the translate function', () => {
    const labels = employmentTypeLabels(key => `<${key}>`)
    expect(labels).toEqual({
      full_time: '<typeFullTime>',
      part_time: '<typePartTime>',
      internship: '<typeInternship>',
      contract: '<typeContract>',
    })
  })
})

describe('jobRef / roleWithRef', () => {
  it('builds a short readable reference from the id', () => {
    expect(jobRef(ID)).toBe('KS-9139D2AA')
    expect(roleWithRef({ id: ID, title: 'Marketing Intern' })).toBe('Marketing Intern - KS-9139D2AA')
  })
})
