import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import MobileFilterSheet from '@/components/MobileFilterSheet'
import Link from 'next/link'
import { getServerLang, getT } from '@/lib/i18n/server'

export const revalidate = 120

async function getProducts(category?: string, subcategory?: string, state?: string, q?: string, sort?: string) {
  let query = supabase.from('products').select('*, artisan:artisans(*)').eq('status', 'approved')
  if (category) query = query.eq('category', category)
  if (subcategory) query = query.eq('subcategory', subcategory)
  if (state) query = query.eq('state', state)
  if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })
  const { data } = await query
  return (data ?? []) as Product[]
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; subcategory?: string; state?: string; q?: string; sort?: string }> }) {
  const params = await searchParams
  const products = await getProducts(params.category, params.subcategory, params.state, params.q, params.sort)
  const activeCategory = params.category as Category | undefined
  const lang = await getServerLang()
  const t = getT('shop', lang)
  const tc = getT('common', lang)

  return (
    <div style={{ minHeight: '80vh', background: '#E8E3D9' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23B8860B' stroke-width='0.4' opacity='0.1'%3E%3Crect x='10' y='10' width='60' height='60' rx='2'/%3E%3Cline x1='40' y1='0' x2='40' y2='80'/%3E%3Cline x1='0' y1='40' x2='80' y2='40'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>{tc('home')}</Link> / {tc('shop')}
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff' }}>
            {params.q ? <>{t('resultsFor')} "<span style={{ color: '#D4A000' }}>{params.q}</span>"</> : activeCategory ? CATEGORY_META[activeCategory].label : t('allGiProducts')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: '1rem' }}>
            {products.length} {t(products.length !== 1 ? 'products' : 'product')}{params.q ? '' : <> · {t('allGiVerified')} · {t('directFromArtisans')}</>}
          </p>
        </div>
      </div>

      <MobileFilterSheet
        currentCategory={activeCategory}
        currentSubcategory={params.subcategory}
        currentState={params.state}
        currentSort={params.sort}
        currentQ={params.q}
        productCount={products.length}
        labels={{
          filterAndSort: t('filterAndSort'),
          state: t('state'),
          category: t('category'),
          sortBy: t('sortBy'),
          sortFeatured: t('sortFeatured'),
          sortPriceLowHigh: t('sortPriceLowHigh'),
          sortPriceHighLow: t('sortPriceHighLow'),
          removeAll: t('removeAll'),
          apply: t('apply'),
          allStates: t('allStates'),
          allProducts: t('allProducts'),
          productWord: t('product'),
          productsWord: t('products'),
        }}
      />

      <div className="mx-auto max-w-[1280px] px-[5%] py-12">
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B4820' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', marginBottom: '1rem' }}>{t('noProductsFound')}</p>
            <Link href="/join" style={{ color: '#E8380A', fontWeight: 700 }}>{t('inviteArtisan')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 max-sm:grid-cols-2 max-sm:gap-[0.6rem]">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
