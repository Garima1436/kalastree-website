// Tool-calling layer (OpenAI native function calling — see openai.ts's
// callOpenAIWithTools). Deliberately a FALLBACK, not a replacement for the
// existing deterministic retrieval pipeline (retrieval.ts -> eligibility.ts
// -> ranking.ts), which stays the primary path and is unaffected by this
// file. These tools exist specifically for the question shapes that
// pipeline structurally can't answer today because nothing upstream ever
// computes them: a GI-verified-only count, a category count, or an
// out-of-stock count (retrieveCandidateProducts hardcodes .gt('stock', 0),
// so out-of-stock products are invisible before this even existed).
//
// generateResponse gives the model these tools on every call but instructs
// it to prefer the assembled evidence first — a tool call only happens when
// the evidence genuinely doesn't answer the question, keeping the common
// case exactly as fast/deterministic as before.
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CandidateProduct } from './types'
import { matchesGIRegistry, getAllGIProducts } from './relationships'
import { callOpenAIVision } from './openai'
import type { ToolDefinition } from './openai'

const CATEGORIES = ['textile', 'handicraft', 'agricultural', 'food'] as const
const STOCK_FILTERS = ['in_stock', 'out_of_stock', 'any'] as const
type StockFilter = typeof STOCK_FILTERS[number]

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'count_products',
    description:
      'Count real, currently-listed KalaStree marketplace products matching optional filters. ' +
      'Use this whenever the question asks "how many" and the Evidence/product-count facts already given ' +
      'to you do not answer it — e.g. a GI-verified-only count, a count by category ' +
      '(textile/handicraft/agricultural/food), an out-of-stock count, OR a count by material/craft/keyword ' +
      'not covered by those four categories (e.g. "leather", "silk", "pottery" — use the query parameter for ' +
      'these, never guess a category as a stand-in for a specific material). Do not call this for a plain ' +
      'state total if a "Products by State" or "Eligible/ranked products" total is already in your context.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text term (material, craft, or product keyword — e.g. "leather", "silk", "pottery") to count only matching products. Matches product name AND description, same as the site\'s own search. Omit for no keyword filter.' },
        state: { type: 'string', description: 'Exact Indian state/UT name, e.g. "Madhya Pradesh". Omit for no state filter.' },
        category: { type: 'string', enum: CATEGORIES, description: 'Product category filter. Omit for no category filter. Not a substitute for query — categories are only textile/handicraft/agricultural/food.' },
        gi_verified_only: { type: 'boolean', description: 'If true, count only products that are verified against the real GI registry (checked per-product, not guessed).' },
        stock_filter: {
          type: 'string', enum: STOCK_FILTERS,
          description: '"in_stock" (default, matches what a customer can actually buy), "out_of_stock", or "any" for a true total regardless of stock. Use "out_of_stock" only when explicitly asked about out-of-stock items.',
        },
      },
    },
  },
  {
    name: 'search_products',
    description:
      'Search real KalaStree marketplace products by free-text keyword (material/craft/product name — matches ' +
      'the same way the site\'s own search does, across name AND description, not just an exact name match), ' +
      'plus optional filters. Use this whenever the question needs specific product results — naming a ' +
      'material/craft/product not already in the current Evidence/Eligible-products, or a follow-up like ' +
      '"show me some" / "whichever is available" after a count question about something specific.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search term (e.g. a material like "leather", a craft, or a product name mentioned by the user).' },
        state: { type: 'string', description: 'Exact Indian state/UT name. Omit for no state filter.' },
        category: { type: 'string', enum: CATEGORIES },
        max_price: { type: 'number' },
        min_price: { type: 'number' },
      },
    },
  },
  {
    name: 'get_news_events',
    description:
      'Look up KalaStree\'s real News & Events entries (press coverage, publications, announcements, milestones), ' +
      'including a body excerpt AND an OCR transcription of each article\'s actual clipping image ' +
      '(clipping_image_text — reads the real scanned newspaper page, including its masthead/publication name, ' +
      'even when that was never typed into the body text). Use for ANY question about where/whether KalaStree ' +
      'has been covered in the press or media, what has been published, recent news/announcements, or a detail ' +
      'about a SPECIFIC article already mentioned in this conversation (e.g. "which newspaper published that?", ' +
      '"what did it say?"). Call it again for such a follow-up rather than re-describing the previous answer ' +
      'from memory. IMPORTANT: the "author" field is often a wire-service/agency credit with a dateline city, ' +
      'e.g. "Agency, Mathura" — that city is NOT the newspaper\'s name, and must never be reported as one. Only ' +
      'state a specific publication/newspaper name when the body excerpt or clipping_image_text explicitly names ' +
      'one; if no publication is named/legible in either, say the specific outlet isn\'t specified rather than ' +
      'guessing from the author/dateline field. The site has a real News & Events page (kalastree.com/about/news) ' +
      'with actual published newspaper articles — do not give the fallback refusal for a news/press question ' +
      'without calling this first.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional free-text term (matches title/author/body) to filter to a specific topic or person. Omit to list the most recent entries.' },
      },
    },
  },
  {
    name: 'count_artisans',
    description:
      'Count real KalaStree ARTISANS (the people/makers on the platform) — NOT products. Use for ANY "how many ' +
      'artisans" question, or a question about which states/crafts artisans are from. NEVER answer an artisan ' +
      'question by reusing a product-count result (e.g. a GI-verified PRODUCT count is a different number from ' +
      'the number of ARTISANS, even though they sound related — conflating them gives a real wrong answer).',
    parameters: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Exact Indian state/UT name. Omit for no state filter.' },
        craft: { type: 'string', description: 'Free-text craft/keyword to filter by (matches the artisan\'s craft field). Omit for no craft filter.' },
      },
    },
  },
  {
    name: 'list_gi_products',
    description:
      'Look up KalaStree\'s real Geographical Indication (GI) REGISTRY (the ~478 officially registered GI crafts ' +
      'it cross-checks products against — kalastree.com/gi-products) — NOT the marketplace products for sale. Use ' +
      'for "list your GI products/tags", "what GI products do you track", or any question about the registry ' +
      'itself rather than what is currently for sale. NEVER substitute a marketplace product search for this — ' +
      'the registry and the marketplace are two different, independently-sized lists.',
    parameters: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Exact Indian state/UT name. Omit for no state filter.' },
        craft: { type: 'string', description: 'Free-text craft/keyword to filter by name. Omit for no craft filter.' },
      },
    },
  },
]

function buildBaseQuery(filters: { state?: string; category?: string; stock_filter?: StockFilter; query?: string }) {
  let query = supabaseAdmin.from('products').select('*, artisan:artisans(*)').eq('status', 'approved')
  if (filters.state) query = query.eq('state', filters.state)
  if (filters.category) query = query.eq('category', filters.category)
  const stockFilter = filters.stock_filter ?? 'in_stock'
  if (stockFilter === 'in_stock') query = query.gt('stock', 0)
  else if (stockFilter === 'out_of_stock') query = query.eq('stock', 0)
  // Same full-text search the shop page itself uses (search_vector, indexed
  // across name + description, not just an exact name substring) — a
  // narrower name-only match previously missed real matches whose material
  // is only mentioned in the description (e.g. "Handcrafted Fur Deer
  // Figure" for a "leather" query — its name doesn't say leather, but its
  // description does, and the site's own search correctly finds it).
  if (filters.query) query = query.textSearch('search_vector', filters.query, { type: 'websearch', config: 'english' })
  return query
}

async function executeCountProducts(args: {
  query?: string
  state?: string
  category?: string
  gi_verified_only?: boolean
  stock_filter?: StockFilter
}): Promise<string> {
  const stockFilter: StockFilter = STOCK_FILTERS.includes(args.stock_filter as StockFilter) ? args.stock_filter! : 'in_stock'
  const { data, error } = await buildBaseQuery({ ...args, stock_filter: stockFilter })
  if (error) return JSON.stringify({ error: error.message })

  let products = (data ?? []) as CandidateProduct[]

  if (args.gi_verified_only) {
    const giProducts = await getAllGIProducts()
    products = products.filter(p => matchesGIRegistry(p, giProducts) !== null)
  }

  return JSON.stringify({
    count: products.length,
    filters_applied: {
      query: args.query ?? null,
      state: args.state ?? null,
      category: args.category ?? null,
      gi_verified_only: !!args.gi_verified_only,
      stock_filter: stockFilter,
    },
    example_names: products.slice(0, 5).map(p => p.name),
  })
}

async function executeSearchProducts(args: {
  query?: string
  state?: string
  category?: string
  max_price?: number
  min_price?: number
}): Promise<string> {
  let query = buildBaseQuery({ state: args.state, category: args.category, stock_filter: 'in_stock', query: args.query })
  if (args.max_price != null) query = query.lte('price', args.max_price)
  if (args.min_price != null) query = query.gte('price', args.min_price)

  const { data, error } = await query.limit(10)
  if (error) return JSON.stringify({ error: error.message })
  const products = (data ?? []) as CandidateProduct[]

  return JSON.stringify({
    count: products.length,
    products: products.map(p => ({
      name: p.name, price: p.price, state: p.state, category: p.category,
      artisan: p.artisan?.name ?? 'unknown', stock: p.stock,
    })),
  })
}

// A published clipping image is effectively immutable, so an OCR result is
// cached indefinitely (for this server's lifetime) — avoids re-running a
// real vision API call on every question that happens to list the same
// article. Keyed by image_url, same in-memory pattern as the craft/GI-tag
// caches elsewhere in this pipeline.
const newsImageOcrCache = new Map<string, string>()

// Reproduced live: the article's manually-typed body field said nothing
// about which newspaper published it, but the actual clipping IMAGE
// visibly shows the masthead (e.g. "दैनिक समर्थ सहारा" / Dainik Samarth
// Sahara) — an admin only has to upload the clipping, not transcribe it.
// Reads the image directly via vision rather than depending on whatever
// happened to get typed into body, which can be incomplete or missing.
async function ocrNewsImage(imageUrl: string): Promise<string> {
  const cached = newsImageOcrCache.get(imageUrl)
  if (cached !== undefined) return cached
  try {
    const text = await callOpenAIVision(
      imageUrl,
      'This is a newspaper/press clipping image. Transcribe the newspaper/publication name (the masthead — the ' +
      'large title text at the top of the page/clipping) and any other clearly legible text (headline, date, ' +
      'byline). If no publication name is visible or legible, say so explicitly rather than guessing.'
    )
    newsImageOcrCache.set(imageUrl, text)
    return text
  } catch (err) {
    console.error('News clipping OCR failed:', err)
    return ''
  }
}

// Reproduced live: asked "in which newspaper is it published?" as a
// follow-up on a specific article, the bot just re-listed article titles
// instead of answering — because the tool never returned body text (and
// even the body, once added, didn't cover every article — see
// ocrNewsImage above). Includes a body excerpt AND an OCR read of the
// clipping image so follow-up questions about a specific article's
// content/publication are answerable from the real source, not a
// possibly-incomplete manual transcription.
async function executeGetNewsEvents(args: { query?: string }): Promise<string> {
  let query = supabaseAdmin.from('news_events').select('title, author, published_at, external_link, body, image_url')
  if (args.query) {
    query = query.or(`title.ilike.%${args.query}%,author.ilike.%${args.query}%,body.ilike.%${args.query}%`)
  }
  const { data, error } = await query.order('published_at', { ascending: false }).limit(10)
  if (error) return JSON.stringify({ error: error.message })

  const rows = data ?? []
  // OCR is a real API round trip per image — capped to the most recent
  // few rather than every historical entry, to bound latency/cost.
  const OCR_LIMIT = 3
  const ocrTexts = await Promise.all(
    rows.slice(0, OCR_LIMIT).map(n => (n.image_url ? ocrNewsImage(n.image_url) : Promise.resolve('')))
  )

  return JSON.stringify({
    count: rows.length,
    entries: rows.map((n, i) => ({
      title: n.title,
      author: n.author,
      published_at: n.published_at,
      external_link: n.external_link,
      body_excerpt: (n.body ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
      clipping_image_text: i < ocrTexts.length ? ocrTexts[i] : null,
    })),
  })
}

// Mirrors artisans/page.tsx's own visibility rule exactly (a portal-login
// artisan only counts once their email is confirmed; an admin-added
// artisan with no portal login always counts) — so this reports the same
// number a real visitor to /artisans would see, not the raw table count.
async function executeCountArtisans(args: { state?: string; craft?: string }): Promise<string> {
  const { data: allArtisans, error } = await supabaseAdmin.from('artisans').select('name, state, craft, user_id')
  if (error) return JSON.stringify({ error: error.message })
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const confirmedUserIds = new Set(users.filter(u => u.email_confirmed_at).map(u => u.id))

  let artisans = (allArtisans ?? []).filter(a => !a.user_id || confirmedUserIds.has(a.user_id))
  if (args.state) artisans = artisans.filter(a => a.state?.toLowerCase() === args.state!.toLowerCase())
  if (args.craft) {
    const c = args.craft.toLowerCase()
    artisans = artisans.filter(a => a.craft?.toLowerCase().includes(c))
  }

  const byState = new Map<string, number>()
  for (const a of artisans) {
    if (a.state) byState.set(a.state, (byState.get(a.state) ?? 0) + 1)
  }

  return JSON.stringify({
    count: artisans.length,
    by_state: Object.fromEntries(byState),
    example_names: artisans.slice(0, 5).map(a => a.name),
  })
}

// Reuses the same cached registry lookup relationships.ts already
// maintains for GI verification (getAllGIProducts, 5-min TTL) rather than
// a fresh query — this IS the real registry the site's own /gi-products
// page and every GI-verification check in this pipeline is built on.
async function executeListGIProducts(args: { state?: string; craft?: string }): Promise<string> {
  let giProducts = await getAllGIProducts()
  if (args.state) giProducts = giProducts.filter(g => g.state.toLowerCase() === args.state!.toLowerCase())
  if (args.craft) {
    const c = args.craft.toLowerCase()
    giProducts = giProducts.filter(g => g.name.toLowerCase().includes(c))
  }

  return JSON.stringify({
    count: giProducts.length,
    entries: giProducts.slice(0, 20).map(g => ({ name: g.name, gi_tag: g.gi_tag, state: g.state })),
  })
}

export async function executeTool(name: string, argumentsJson: string): Promise<string> {
  let args: Record<string, unknown> = {}
  try {
    args = JSON.parse(argumentsJson || '{}')
  } catch {
    return JSON.stringify({ error: 'Invalid tool arguments JSON' })
  }

  switch (name) {
    case 'count_products':
      return executeCountProducts(args as any)
    case 'search_products':
      return executeSearchProducts(args as any)
    case 'get_news_events':
      return executeGetNewsEvents(args as any)
    case 'count_artisans':
      return executeCountArtisans(args as any)
    case 'list_gi_products':
      return executeListGIProducts(args as any)
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}
