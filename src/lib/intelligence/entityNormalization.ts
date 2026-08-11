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

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))
  for (let i = 0; i < rows; i++) dp[i][0] = i
  for (let j = 0; j < cols; j++) dp[0][j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[rows - 1][cols - 1]
}

// Best-effort fuzzy match: exact -> synonym table -> substring either
// direction -> bounded edit-distance (last resort, for typos substring
// matching can't catch — e.g. "madhyadpradesh" for "Madhya Pradesh", one
// inserted character, no shared contiguous substring long enough to
// contain the other). Threshold is intentionally tight (relative to
// candidate length, capped) so this doesn't silently resolve to the wrong
// entity — a wrong match here would corrupt a hard constraint downstream.
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

  let best: { candidate: string; distance: number } | null = null
  for (const candidate of candidates) {
    const c = normalizeText(candidate)
    const distance = levenshtein(resolved, c)
    const threshold = Math.min(3, Math.max(1, Math.floor(c.length * 0.15)))
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { candidate, distance }
    }
  }
  return best?.candidate ?? null
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
