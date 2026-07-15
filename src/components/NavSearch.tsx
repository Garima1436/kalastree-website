'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { CATEGORY_META } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface SearchProduct {
  id: string
  name: string
  slug: string
  images: string[] | null
  price: number
  category: string
  state: string
}

interface SearchArtisan {
  id: string
  name: string
  slug: string
  photo_url: string | null
  craft: string
  state: string
}

const POPULAR = ['Pashmina', 'Madhubani', 'Banarasi Silk', 'Kanchipuram', 'Phulkari', 'Rajasthan']

export default function NavSearch({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('shopping')
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<SearchProduct[]>([])
  const [artisans, setArtisans] = useState<SearchArtisan[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const q = query.trim()
    if (!q) { setProducts([]); setArtisans([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const supabase = createClient()
      const [{ data: prods }, { data: arts }] = await Promise.all([
        supabase.from('products')
          .select('id, name, slug, images, price, category, state')
          .or(`name.ilike.%${q}%,description.ilike.%${q}%,state.ilike.%${q}%,gi_tag.ilike.%${q}%,category.ilike.%${q}%`)
          .limit(5),
        supabase.from('artisans')
          .select('id, name, slug, photo_url, craft, state')
          .or(`name.ilike.%${q}%,craft.ilike.%${q}%,state.ilike.%${q}%`)
          .limit(3),
      ])
      setProducts((prods ?? []) as SearchProduct[])
      setArtisans((arts ?? []) as SearchArtisan[])
      setLoading(false)
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  const go = useCallback((href: string) => {
    router.push(href)
    onClose()
  }, [router, onClose])

  const hasResults = products.length > 0 || artisans.length > 0
  const q = query.trim()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,5,0,0.45)', backdropFilter: 'blur(2px)' }} />

      {/* Panel */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#FFFFFF', borderBottom: '2px solid #DDB840', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 1 }}>

        {/* Input row */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 5%', height: 64, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #EDD060' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A07840" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && q) go(`/shop?q=${encodeURIComponent(q)}`) }}
            placeholder={t('searchPlaceholder')}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '1.05rem', fontFamily: "'Lato', sans-serif", color: '#1B2E4A' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#A07840', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 4 }}>✕</button>
          )}
          <button onClick={onClose} style={{ flexShrink: 0, background: 'none', border: '1.5px solid #DDB840', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', color: '#6B4820', fontSize: '0.72rem', fontFamily: "'Lato', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>
            ESC
          </button>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0.75rem 5% 1.25rem' }}>

          {/* Loading */}
          {loading && <p style={{ color: '#A07840', fontSize: '0.85rem', padding: '0.5rem 0' }}>{t('searching')}</p>}

          {/* No results */}
          {!loading && q && !hasResults && (
            <div style={{ padding: '1.25rem 0', color: '#A07840', textAlign: 'center' }}>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', color: '#6B4820' }}>{t('noResultsFor')} "<strong>{q}</strong>"</p>
              <p style={{ fontSize: '0.78rem', marginTop: 6 }}>{t('tryCraftNameStateOrMaterial')}</p>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '0.5rem' }}>{t('productsLabel')}</div>
              {products.map(p => {
                const cat = CATEGORY_META[p.category as keyof typeof CATEGORY_META] ?? { bg: '#FFE8A8', color: '#6B4820', icon: '🏺', label: p.category }
                return (
                  <button key={p.id} onClick={() => go(`/shop/${p.slug}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #FFE8A8', padding: '8px 6px', cursor: 'pointer', borderRadius: 6, textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FFF5E0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 8, background: cat.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #DDB840' }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1B2E4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 2 }}>{p.state} · {cat.label}</div>
                    </div>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontWeight: 700, fontSize: '1rem', color: '#E8380A', flexShrink: 0 }}>₹{p.price.toLocaleString('en-IN')}</div>
                  </button>
                )
              })}
              {q && (
                <button onClick={() => go(`/shop?q=${encodeURIComponent(q)}`)}
                  style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: '#E8380A', fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '4px 6px' }}>
                  {t('seeAllResultsFor')} "{q}" →
                </button>
              )}
            </div>
          )}

          {/* Artisans */}
          {artisans.length > 0 && (
            <div style={{ marginTop: products.length > 0 ? '0.75rem' : 0 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '0.5rem' }}>{t('artisansLabel')}</div>
              {artisans.map(a => (
                <button key={a.id} onClick={() => go(`/artisans/${a.slug}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #FFE8A8', padding: '8px 6px', cursor: 'pointer', borderRadius: 6, textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF5E0' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#FFE8A8', border: '2px solid #D4A000', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {a.photo_url ? <img src={a.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>👩‍🎨</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1B2E4A' }}>{a.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 2 }}>{a.craft} · {a.state}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#E8380A', fontWeight: 700 }}>{t('viewArrow')} →</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular searches (empty state) */}
          {!q && (
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '0.6rem' }}>{t('popularSearches')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {POPULAR.map(term => (
                  <button key={term} onClick={() => setQuery(term)}
                    style={{ background: '#FFE8A8', border: '1px solid #DDB840', borderRadius: 20, padding: '5px 14px', fontSize: '0.8rem', fontFamily: "'Lato', sans-serif", color: '#6B4820', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5D888'; e.currentTarget.style.color = '#E8380A' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFE8A8'; e.currentTarget.style.color = '#6B4820' }}>
                    🔍 {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
