import { describe, it, expect } from 'vitest'
import { buildOpeningFields, isUuid } from './careersValidation'

const valid = { title: 'Marketing Associate', location: 'Patna', employment_type: 'full_time', description: 'Run campaigns.' }

describe('buildOpeningFields (create)', () => {
  it('accepts the minimum valid input and trims text', () => {
    const r = buildOpeningFields({ ...valid, title: '  Marketing Associate  ' }, true)
    expect(r).toEqual({ fields: { title: 'Marketing Associate', location: 'Patna', description: 'Run campaigns.', employment_type: 'full_time' } })
  })

  it.each(['title', 'location', 'description', 'employment_type'])('requires %s', key => {
    const body: Record<string, unknown> = { ...valid }
    delete body[key]
    expect('message' in buildOpeningFields(body, true)).toBe(true)
  })

  it('rejects a whitespace-only required field', () => {
    expect(buildOpeningFields({ ...valid, title: '   ' }, true)).toEqual({ message: 'title is required' })
  })

  it('rejects an unknown employment type', () => {
    expect(buildOpeningFields({ ...valid, employment_type: 'freelance' }, true)).toEqual({ message: 'employment_type is invalid' })
  })

  it('rejects over-long text', () => {
    const r = buildOpeningFields({ ...valid, title: 'x'.repeat(121) }, true)
    expect(r).toEqual({ message: 'title is too long (max 120 characters)' })
  })

  it('rejects non-string text fields', () => {
    expect(buildOpeningFields({ ...valid, description: 123 }, true)).toEqual({ message: 'description must be text' })
  })

  it('stores empty optional Hindi fields as null', () => {
    const r = buildOpeningFields({ ...valid, title_hi: '  ', description_hi: '' }, true)
    expect(r).toMatchObject({ fields: { title_hi: null, description_hi: null } })
  })

  it('rejects a non-boolean is_active', () => {
    expect(buildOpeningFields({ ...valid, is_active: 'yes' }, true)).toEqual({ message: 'is_active must be true or false' })
  })

  it('never passes through columns that are not whitelisted', () => {
    const r = buildOpeningFields({ ...valid, id: 'abc', created_at: '2000-01-01', admin: true }, true)
    expect(r).toHaveProperty('fields')
    const fields = (r as { fields: Record<string, unknown> }).fields
    expect(Object.keys(fields).sort()).toEqual(['description', 'employment_type', 'location', 'title'])
  })
})

describe('buildOpeningFields (update)', () => {
  it('allows a visibility toggle with only is_active', () => {
    expect(buildOpeningFields({ is_active: false }, false)).toEqual({ fields: { is_active: false } })
  })

  it('returns no fields when nothing relevant was sent', () => {
    expect(buildOpeningFields({}, false)).toEqual({ fields: {} })
  })

  it('still validates any field that is sent', () => {
    expect(buildOpeningFields({ employment_type: 'nope' }, false)).toEqual({ message: 'employment_type is invalid' })
    expect(buildOpeningFields({ title: '' }, false)).toEqual({ message: 'title is required' })
  })
})

describe('isUuid', () => {
  it('accepts a real uuid and rejects everything else', () => {
    expect(isUuid('9139d2aa-1440-4590-8630-7dcb85f7cae6')).toBe(true)
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid("1' or '1'='1")).toBe(false)
    expect(isUuid(undefined)).toBe(false)
    expect(isUuid(42)).toBe(false)
  })
})
