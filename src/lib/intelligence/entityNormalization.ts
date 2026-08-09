// Normalizes free-text entities (craft names, states) onto the canonical
// values that actually exist in the knowledge base, instead of trusting
// whatever spelling the LLM extraction step produced. "Do not invent
// aliases" (spec section 5) — every alias here is either an exact/substring
// match against real gi_products/artisans data, or one of a tiny set of
// well-established synonyms for the same registered GI (not a guess).
import { supabaseAdmin } from '@/lib/supabase-admin'
import { INDIAN_STATES } from '@/lib/indian-states'

// Well-known alternate names for the same craft, e.g. "Madhubani Painting"
// is also widely called "Mithila Painting" (same GI region/tradition) —
// this is documented terminology, not an invented mapping.
const KNOWN_SYNONYMS: Record<string, string> = {
  'mithila painting': 'madhubani painting',
  'mithila art': 'madhubani painting',
  'madhubani art': 'madhubani painting',
}

interface KnowledgeCache {
  crafts: string[]
  giTags: string[]
  fetchedAt: number
}

let cache: KnowledgeCache | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function getKnowledgeCache(): Promise<KnowledgeCache> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache

  const [giProductsRes, artisansRes] = await Promise.all([
    supabaseAdmin.from('gi_products').select('name, gi_tag'),
    supabaseAdmin.from('artisans').select('craft'),
  ])

  const crafts = new Set<string>()
  const giTags = new Set<string>()
  for (const row of giProductsRes.data ?? []) {
    if (row.name) crafts.add(row.name)
    if (row.gi_tag) giTags.add(row.gi_tag)
  }
  for (const row of artisansRes.data ?? []) {
    if (row.craft) crafts.add(row.craft)
  }

  cache = { crafts: [...crafts], giTags: [...giTags], fetchedAt: Date.now() }
  return cache
}

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Best-effort fuzzy match: exact -> synonym table -> substring either
// direction. No token-overlap scoring — deliberately simple, since a wrong
// normalization here would silently corrupt a hard constraint downstream.
function fuzzyMatch(input: string, candidates: string[]): string | null {
  const normalized = normalizeText(input)
  const resolved = KNOWN_SYNONYMS[normalized] ?? normalized

  for (const candidate of candidates) {
    if (normalizeText(candidate) === resolved) return candidate
  }
  for (const candidate of candidates) {
    const c = normalizeText(candidate)
    if (c.includes(resolved) || resolved.includes(c)) return candidate
  }
  return null
}

export async function normalizeCraft(input: string | null): Promise<string | null> {
  if (!input) return null
  const { crafts, giTags } = await getKnowledgeCache()
  return fuzzyMatch(input, crafts) ?? fuzzyMatch(input, giTags) ?? input
}

export function normalizeState(input: string | null): string | null {
  if (!input) return null
  return fuzzyMatch(input, INDIAN_STATES) ?? input
}
