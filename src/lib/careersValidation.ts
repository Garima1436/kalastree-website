import { EMPLOYMENT_TYPES } from './careers'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value)

// Pulls the role id off the end of a /careers/<slug>-<uuid> path segment. Returns null
// for anything that doesn't end in a well-formed uuid, so nothing else reaches the database.
export function parseOpeningId(param: string): string | null {
  const match = param.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)
  return match ? match[1] : null
}

// Only these columns can ever be written, whatever the request body contains.
const TEXT_FIELDS: Record<string, { max: number; required: boolean }> = {
  title: { max: 120, required: true },
  title_hi: { max: 120, required: false },
  location: { max: 120, required: true },
  description: { max: 3000, required: true },
  description_hi: { max: 3000, required: false },
}

export type OpeningFieldsResult = { fields: Record<string, unknown> } | { message: string }

// isCreate: every required field must be present. Otherwise (an update) only the
// fields that were sent are validated and returned, so e.g. a Hide/Show toggle
// can send just { is_active }.
export function buildOpeningFields(body: Record<string, unknown>, isCreate: boolean): OpeningFieldsResult {
  const fields: Record<string, unknown> = {}

  for (const [key, { max, required }] of Object.entries(TEXT_FIELDS)) {
    const value = body[key]
    if (value === undefined) {
      if (isCreate && required) return { message: `${key} is required` }
      continue
    }
    if (typeof value !== 'string') return { message: `${key} must be text` }
    const trimmed = value.trim()
    if (required && !trimmed) return { message: `${key} is required` }
    if (trimmed.length > max) return { message: `${key} is too long (max ${max} characters)` }
    // Optional Hindi fields are stored as null when left empty.
    fields[key] = trimmed || null
  }

  if (body.employment_type !== undefined || isCreate) {
    if (typeof body.employment_type !== 'string' || !(EMPLOYMENT_TYPES as string[]).includes(body.employment_type)) {
      return { message: 'employment_type is invalid' }
    }
    fields.employment_type = body.employment_type
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') return { message: 'is_active must be true or false' }
    fields.is_active = body.is_active
  }

  return { fields }
}
