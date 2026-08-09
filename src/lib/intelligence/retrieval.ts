// Stage 5: Hybrid knowledge retrieval (spec sections 12-13).
//
// Combines (1) structured metadata filtering + full-text search against the
// live product catalogue (Supabase) for candidate products, and (2)
// semantic retrieval against the Python backend's Chroma-backed narrative
// corpus for craft/GI/cultural evidence. Metadata filtering is preferred
// over pure vector similarity wherever a filter is available (section 12).
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CandidateProduct, ExtractedEntities, Intent, NarrativeChunk } from './types'
import { NARRATIVE_INTENTS } from './types'

const CHATBOT_BACKEND_URL = process.env.CHATBOT_BACKEND_URL ?? 'https://ashish766733-kalastree-chatbot.hf.space'

// PostgREST's `.or()` filter syntax treats `,` (condition separator) and
// `()` (grouping) specially in the VALUE portion too — an unescaped one
// silently breaks the filter rather than erroring (see relationships.ts's
// resolveGIProduct for the bug this caused with "Bhagalpur Silk (Tussar)").
// Both `.or()` calls below interpolate LLM-extracted text, so strip those
// characters first; safe here because they're never meaningful inside a
// single craft keyword.
function sanitizeForOrFilter(value: string): string {
  return value.replace(/[,()]/g, '')
}

export async function retrieveCandidateProducts(entities: ExtractedEntities): Promise<CandidateProduct[]> {
  let query = supabaseAdmin.from('products').select('*, artisan:artisans(*)').gt('stock', 0)

  if (entities.state) query = query.eq('state', entities.state)
  if (entities.craft) {
    // A product's own name/category rarely repeats the full craft phrase
    // verbatim (e.g. "Madhubani Hand-Painted Tussar Silk Stole" for craft
    // "Madhubani Painting") — match on the craft's primary keyword (its
    // first significant word, the actual distinguishing term) instead of
    // requiring the whole phrase as one contiguous substring. This is a
    // recall-favoring first pass; the eligibility engine (which also checks
    // the joined artisan.craft field, and has the full candidate rows to
    // reason over) applies the precise match afterwards.
    const keyword = sanitizeForOrFilter(entities.craft.split(/\s+/)[0])
    query = query.or(`name.ilike.%${keyword}%,gi_tag.ilike.%${keyword}%,category.ilike.%${keyword}%`)
  } else if (entities.product_type) {
    query = query.textSearch('search_vector', entities.product_type, { type: 'websearch', config: 'english' })
  }
  if (entities.max_price != null) query = query.lte('price', entities.max_price)
  if (entities.min_price != null) query = query.gte('price', entities.min_price)

  const { data, error } = await query.limit(50)
  if (error) {
    console.error('retrieveCandidateProducts failed:', error)
    return []
  }
  const candidates = (data ?? []) as CandidateProduct[]

  // The keyword filter above can't reach the joined artisans table via
  // Supabase's .or() syntax, so a product whose OWN name/category doesn't
  // mention the craft but whose artisan's craft field does (e.g. a plain
  // "silk stole" made by a Madhubani-craft artisan) would be missed by the
  // query above. Catch those with a second, artisan-scoped pass.
  if (entities.craft) {
    const keyword = entities.craft.split(/\s+/)[0]
    const { data: byArtisan, error: artisanQueryError } = await supabaseAdmin
      .from('products')
      .select('*, artisan:artisans!inner(*)')
      .gt('stock', 0)
      .ilike('artisan.craft', `%${keyword}%`)

    if (artisanQueryError) {
      console.error('retrieveCandidateProducts (artisan-craft pass) failed:', artisanQueryError)
    } else {
      const seen = new Set(candidates.map(c => c.id))
      for (const row of (byArtisan ?? []) as unknown as CandidateProduct[]) {
        if (!seen.has(row.id)) { candidates.push(row); seen.add(row.id) }
      }
    }
  }

  return candidates
}

// Narrative/cultural evidence from the Python backend's existing Chroma
// vector store — only called for intents that actually need it, so a
// plain product lookup doesn't pay the extra network hop.
export async function retrieveNarrativeEvidence(question: string, intents: Intent[]): Promise<NarrativeChunk[]> {
  const needsNarrative = intents.some(i => NARRATIVE_INTENTS.includes(i))
  if (!needsNarrative) return []

  try {
    const response = await fetch(`${CHATBOT_BACKEND_URL}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, k: 5 }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data.chunks) ? data.chunks : []
  } catch (err) {
    console.error('Narrative evidence retrieval failed (non-fatal):', err)
    return []
  }
}
