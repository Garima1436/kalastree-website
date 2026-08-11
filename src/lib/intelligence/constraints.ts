// Stage 2: Constraint construction (spec section 9).
//
// Turns extracted entities into explicit hard/soft constraints. Hard
// constraints are enforced by the eligibility engine (products.ts) and
// MUST be satisfied; soft constraints only influence ranking. This split is
// what lets the eligibility engine reject products deterministically
// instead of leaving that judgment to the LLM.
import type { StructuredQuery, Constraint } from './types'

export function buildConstraints(query: StructuredQuery): Constraint[] {
  const e = query.entities
  const constraints: Constraint[] = []

  if (e.state) {
    constraints.push({ field: 'state', operator: '=', value: e.state, kind: 'hard', label: e.state })
  }
  if (e.gi_required) {
    constraints.push({ field: 'gi_verified', operator: '=', value: true, kind: 'hard', label: 'GI verified' })
  }
  if (e.craft) {
    constraints.push({ field: 'craft', operator: '=', value: e.craft, kind: 'hard', label: e.craft })
  }

  // Every artisan on KalaStree is a woman ("Heritage by Her") — there is no
  // artisan_gender column to filter on, so this is trivially satisfied by
  // every product either way (see eligibility.ts). Its `kind` still needs
  // to be correct, though, for matched_constraints/explainability to
  // honestly reflect what the user actually asked for: a firm statement
  // ("made by a woman artisan", "only women artisans") is hard; an
  // explicitly hedged one ("I prefer...", "preferably...") is soft.
  // Unhedged mentions default to hard, matching how most users phrase it.
  if (e.artisan_gender === 'female') {
    const kind = e.artisan_gender_mode === 'preferred' ? 'soft' : 'hard'
    constraints.push({ field: 'artisan_gender', operator: '=', value: 'female', kind, label: 'female artisan' })
  }

  // "under X" -> hard max. "around X" -> soft target (spec example 4:
  // don't treat an approximate figure as an exact ceiling).
  if (e.max_price != null && (e.price_mode === 'max' || e.price_mode === null)) {
    constraints.push({ field: 'max_price', operator: '<=', value: e.max_price, kind: 'hard', label: `under ₹${e.max_price}` })
  }
  if (e.min_price != null) {
    constraints.push({ field: 'min_price', operator: '>=', value: e.min_price, kind: 'hard', label: `above ₹${e.min_price}` })
  }
  if (e.target_price != null || (e.max_price != null && e.price_mode === 'target')) {
    const target = e.target_price ?? e.max_price!
    constraints.push({ field: 'target_price', operator: '=', value: target, kind: 'soft', label: `around ₹${target}` })
  }

  // Availability is always a hard constraint — never recommend out-of-stock items.
  constraints.push({ field: 'availability', operator: '>0', value: true, kind: 'hard', label: 'in stock' })

  return constraints
}

export function hardConstraints(constraints: Constraint[]): Constraint[] {
  return constraints.filter(c => c.kind === 'hard')
}

export function softConstraints(constraints: Constraint[]): Constraint[] {
  return constraints.filter(c => c.kind === 'soft')
}
