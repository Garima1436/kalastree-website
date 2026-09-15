// Stage 3: GI / craft / region / artisan relationship resolution
// (spec section 6). Deterministic Supabase lookups — no LLM involved.
//
//   GI_PRODUCT --belongs_to--> STATE
//   GI_PRODUCT --represents--> CRAFT      (gi_products.name/gi_tag)
//   CRAFT      --practiced_by--> ARTISAN  (artisans.craft, artisans.gi_product_id)
//   ARTISAN    --creates--> PRODUCT       (products.artisan_id)
//   PRODUCT    --associated_with--> GI_PRODUCT (products.gi_product_id)
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { GIProduct, Artisan } from '@/lib/types'
import type { ExtractedEntities } from './types'

// Resolves the GI_PRODUCT an entity (craft name, GI tag, or product state)
// refers to. Returns null when nothing matches — the caller must treat that
// as "not verified", never as "probably still GI".
//
// Matches in-memory against the cached registry (getAllGIProducts, defined
// below — hoisted, so the forward reference is fine) rather than building a
// hand-interpolated PostgREST `.or()` filter string. That used to break
// silently on craft names containing characters PostgREST's filter syntax
// treats specially — e.g. "Bhagalpur Silk (Tussar)" has parentheses, which
// `or=` interprets as filter grouping, so the query matched nothing.
export async function resolveGIProduct(entities: ExtractedEntities): Promise<GIProduct | null> {
  if (!entities.craft && !entities.state) return null

  const giProducts = await getAllGIProducts()
  const pool = entities.state
    ? giProducts.filter(g => g.state.toLowerCase() === entities.state!.toLowerCase())
    : giProducts

  if (!entities.craft) return pool[0] ?? null

  const craft = entities.craft.toLowerCase()
  return (
    pool.find(g => g.name.toLowerCase() === craft || g.gi_tag.toLowerCase() === craft) ??
    pool.find(g => craft.includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(craft)) ??
    null
  )
}

export async function findArtisansForGIProduct(giProductId: string): Promise<Artisan[]> {
  const { data } = await supabaseAdmin.from('artisans').select('*').eq('gi_product_id', giProductId)
  return (data ?? []) as Artisan[]
}

export interface StateProductSummary {
  state: string
  count: number
  examples: string[]
}

// Real, live counts — not a research-corpus estimate. Used for aggregate
// "which states / how many products per state / list products from every
// state" questions (see pipeline.ts), which need an actual cross-state
// breakdown rather than a single-state-scoped search.
export async function getProductCountsByState(): Promise<StateProductSummary[]> {
  const { data, error } = await supabaseAdmin.from('products').select('state, name').gt('stock', 0)
  if (error) {
    console.error('getProductCountsByState failed:', error)
    return []
  }

  const byState = new Map<string, string[]>()
  for (const row of data ?? []) {
    if (!row.state) continue
    const names = byState.get(row.state) ?? []
    names.push(row.name)
    byState.set(row.state, names)
  }

  return [...byState.entries()]
    .map(([state, names]) => ({ state, count: names.length, examples: names.slice(0, 3) }))
    .sort((a, b) => b.count - a.count)
}

// Exact full-name match, or a whole-word match against any single word in
// fullName — deliberately never a raw substring check. A substring check
// has a real collision bug: "manish" is literally a character substring of
// "manisha" (Manish+a), so a query for "manish" (looking for co-founder
// Manish Rawat) would silently match an unrelated person named "Manisha"
// instead. Exported and unit-tested on its own (see relationships.test.ts)
// since it's the same matching rule used both here and in
// kalastreeInfo.ts's isFounderName, and getting it wrong silently returns
// the wrong PERSON, not just a missing answer.
export function matchesPersonName(needle: string, fullName: string): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return false
  const full = fullName.trim().toLowerCase()
  return full === n || full.split(/\s+/).includes(n)
}

// Table is tiny (12 rows at last check) — fetched in full and matched in
// memory via matchesPersonName rather than a raw ILIKE '%name%' filter.
// Reproduced live: "who is manish?" silently matched "Manisha Dhurve" via
// ILIKE '%manish%' and buried the real answer (the co-founder) entirely.
export async function findArtisanByName(name: string): Promise<Artisan | null> {
  const needle = name.trim().toLowerCase()
  if (!needle) return null
  const { data } = await supabaseAdmin.from('artisans').select('*')
  const artisans = (data ?? []) as Artisan[]
  return artisans.find(a => matchesPersonName(needle, a.name)) ?? null
}

export interface NewsMention {
  title: string
  author: string | null
  published_at: string
  external_link: string | null
}

// Reproduced live: asked about a name that isn't a founder/co-founder and
// isn't in the artisans table, the chatbot flatly said "no artisan found"
// even for a name that IS real and IS on the site — just as a News & Events
// author/subject, not an artisan. Before concluding nothing is known about
// a named person, also check here (title/author/body) rather than only the
// single artisans table. Still returns null (and the caller still says "not
// found") for a genuinely unknown name — this only widens where we look.
export async function findNewsMentioningPerson(name: string): Promise<NewsMention | null> {
  const { data } = await supabaseAdmin
    .from('news_events')
    .select('title, author, published_at, external_link, body')
    .or(`author.ilike.%${name}%,title.ilike.%${name}%,body.ilike.%${name}%`)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return { title: data.title, author: data.author, published_at: data.published_at, external_link: data.external_link }
}

export interface ReviewMention {
  reviewerName: string
  productName: string | null
  rating: number
  title: string | null
}

// Same widening as findNewsMentioningPerson, for the third public
// name-bearing source on the site: product reviews (reviewer_name is shown
// publicly on every product page already, so surfacing it here exposes
// nothing that isn't already public). Deliberately selects ONLY
// reviewer_name/rating/title — never email or user_id, which are private
// account fields. For the same reason, profiles/orders/payments/inquiries
// are intentionally never searched by name anywhere in this pipeline: those
// hold private account/order data, and letting an anonymous chatbot confirm
// "yes, a person named X has an account/order" would be a real privacy leak
// (account enumeration), not a helpfulness gap.
export async function findReviewMentioningPerson(name: string): Promise<ReviewMention | null> {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('reviewer_name, rating, title, product_id, products(name)')
    .ilike('reviewer_name', `%${name}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const productName = (data as unknown as { products: { name: string } | null }).products?.name ?? null
  return { reviewerName: data.reviewer_name, productName, rating: data.rating, title: data.title }
}

let giProductsCache: { rows: GIProduct[]; fetchedAt: number } | null = null
const GI_PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000

// Full GI registry, cached briefly. Used to check each candidate PRODUCT
// against the registry individually (see matchesGIRegistry) — deliberately
// NOT the same thing as resolveGIProduct(), which resolves the single GI
// entity the user's query is *about*. A state-only query like "GI product
// from Bihar" has no single "the" GI entity: Bihar may have several
// registered GIs, and each candidate product must be checked against
// whichever one (if any) it actually matches.
export async function getAllGIProducts(): Promise<GIProduct[]> {
  if (giProductsCache && Date.now() - giProductsCache.fetchedAt < GI_PRODUCTS_CACHE_TTL_MS) {
    return giProductsCache.rows
  }
  const { data } = await supabaseAdmin.from('gi_products').select('*')
  const rows = (data ?? []) as GIProduct[]
  giProductsCache = { rows, fetchedAt: Date.now() }
  return rows
}

// Deterministic per-product GI match, in order of trust:
//  1. The real FK (products.gi_product_id), once
//     supabase/migrations/20260809_add_gi_product_links.sql is applied and
//     backfilled.
//  2. products.gi_tag matched exactly against gi_products.gi_tag.
//  3. Name-token fallback: as of writing, products.gi_tag is null on every
//     row in the live catalogue (it's admin-entered free text that hasn't
//     been filled in for any product yet), so (1) and (2) never fire today.
//     Without this fallback the GI eligibility check would silently reject
//     every real product. GI names in this registry follow a
//     "<place/craft identifier> <type>" pattern (e.g. "Madhubani Painting",
//     "Bhagalpur Silk"); the first significant word is the part that
//     actually identifies the GI, so we require that word to appear in the
//     product's name/category/artisan craft, plus a matching state. This is
//     intentionally an interim heuristic — remove it once every product has
//     a real gi_product_id.
export function matchesGIRegistry(
  product: {
    gi_product_id: string | null
    gi_tag: string | null
    state: string | null
    name: string
    category: string
    subcategory?: string | null
    artisan?: { craft: string } | null
  },
  giProducts: GIProduct[]
): GIProduct | null {
  if (product.gi_product_id) {
    return giProducts.find(g => g.id === product.gi_product_id) ?? null
  }
  if (product.gi_tag) {
    const byTag = giProducts.find(g => g.gi_tag.toLowerCase() === product.gi_tag!.toLowerCase())
    if (byTag) return byTag
  }

  const sameState = product.state
    ? giProducts.filter(g => g.state.toLowerCase() === product.state!.toLowerCase())
    : giProducts
  if (!sameState.length) return null

  const haystack = [product.name, product.category, product.subcategory, product.artisan?.craft]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    sameState.find(g => {
      const identifier = g.name.toLowerCase().split(/\s+/)[0]
      return identifier.length > 3 && haystack.includes(identifier)
    }) ?? null
  )
}
