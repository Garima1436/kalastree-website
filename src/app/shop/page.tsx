import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

export const revalidate = 120

async function getProducts(category?: string, state?: string, q?: string) {
  let query = supabase.from('products').select('*, artisan:artisans(*)').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  if (state) query = query.eq('state', state)
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,state.ilike.%${q}%,gi_tag.ilike.%${q}%,category.ilike.%${q}%`)
  const { data } = await query
  return (data ?? []) as Product[]
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; state?: string; q?: string }> }) {
  const params = await searchParams
  const products = await getProducts(params.category, params.state, params.q)
  const activeCategory = params.category as Category | undefined

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23B8860B' stroke-width='0.4' opacity='0.1'%3E%3Crect x='10' y='10' width='60' height='60' rx='2'/%3E%3Cline x1='40' y1='0' x2='40' y2='80'/%3E%3Cline x1='0' y1='40' x2='80' y2='40'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>Home</Link> / Shop
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff' }}>
            {params.q ? <>Results for "<span style={{ color: '#D4A000' }}>{params.q}</span>"</> : activeCategory ? CATEGORY_META[activeCategory].label : 'All GI Products'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: '1rem' }}>
            {products.length} product{products.length !== 1 ? 's' : ''}{params.q ? '' : ' · All GI-verified · Direct from artisans'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 5%', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <aside>
          <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, padding: '1.5rem', position: 'sticky', top: 90 }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginBottom: '1rem' }}>Categories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/shop" style={{ fontSize: '0.9rem', fontWeight: !activeCategory ? 700 : 400, color: !activeCategory ? '#E8380A' : '#6B4820', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, background: !activeCategory ? '#FFE8DC' : 'transparent' }}>
                🌟 All Products
              </Link>
              {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
                <Link key={key} href={`/shop?category=${key}`} style={{ fontSize: '0.9rem', fontWeight: activeCategory === key ? 700 : 400, color: activeCategory === key ? meta.color : '#6B4820', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, background: activeCategory === key ? meta.bg : 'transparent' }}>
                  {meta.icon} {meta.label}
                </Link>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #DDB840', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginBottom: '1rem' }}>Filter by State</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Bihar', 'Jammu & Kashmir', 'West Bengal', 'Uttar Pradesh', 'Rajasthan', 'Tamil Nadu', 'Assam', 'Punjab'].map(state => (
                  <Link key={state} href={`/shop?state=${encodeURIComponent(state)}`} style={{ fontSize: '0.85rem', color: params.state === state ? '#E8380A' : '#6B4820', textDecoration: 'none', fontWeight: params.state === state ? 700 : 400 }}>
                    {state}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B4820' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', marginBottom: '1rem' }}>No products found in this category yet.</p>
              <Link href="/join" style={{ color: '#E8380A', fontWeight: 700 }}>Know an artisan? Invite them to join →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width: 768px) {
          div[style*="grid-template-columns: 220px"] { grid-template-columns: 1fr !important; }
          aside { display: none; }
        }
      `}</style>
    </div>
  )
}
