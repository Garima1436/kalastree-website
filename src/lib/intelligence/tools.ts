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
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}
