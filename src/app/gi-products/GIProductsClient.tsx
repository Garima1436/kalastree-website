'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

export interface GIProduct {
  id: string
  name: string
  state: string
  gi_tag: string
  year: string
  category: 'textile' | 'handicraft' | 'agricultural' | 'food'
  accent: string
  emoji: string
  tagline: string
  women_role: string
  history: string
  materials: string
  district: string
  women_percent: number
  image_url: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  textile: '#1B2E4A', handicraft: '#E8380A', agricultural: '#1A7A32', food: '#C21859',
}

function CardVisual({ product }: { product: GIProduct }) {
  const { t } = useTranslation('giProducts')
  const { t: tc } = useTranslation('common')
  const categoryLabels: Record<string, string> = {
    textile: t('categoryTextile'), handicraft: t('categoryHandicraft'), agricultural: tc('agricultural'), food: tc('foodAndNatural'),
  }
  return (
    <div style={{ height: 200, position: 'relative', borderRadius: '10px 10px 0 0', overflow: 'hidden', background: `linear-gradient(135deg, ${product.accent}18, ${product.accent}30)` }}>
      {product.image_url ? (
        <img src={product.image_url} alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>{product.emoji}</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: 10, left: 10, background: CATEGORY_COLORS[product.category], color: '#fff', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, fontFamily: "'Lato', sans-serif" }}>
        {categoryLabels[product.category]}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: '#D4A000', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, fontFamily: "'Lato', sans-serif" }}>
        {t('giCertified')}
      </div>
    </div>
  )
}

function ProductModal({ product, onClose }: { product: GIProduct; onClose: () => void }) {
  const { t } = useTranslation('giProducts')
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,5,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', border: '1.5px solid #DDB840' }}>
        {/* Header */}
        <div style={{ height: 200, background: `linear-gradient(135deg, ${product.accent}25, ${product.accent}45)`, borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '0 2rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          {product.image_url && (
            <img src={product.image_url} alt={product.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          )}
          <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))', position: 'relative', zIndex: 1 }}>{product.emoji}</span>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', opacity: 0.8, marginBottom: 4 }}>{product.state} · {product.year}</div>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{product.name}</h2>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{product.gi_tag}</div>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B4820', fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Women involvement */}
          <div style={{ background: 'linear-gradient(135deg, #FFF5F0, #FFF8F2)', border: `1.5px solid ${product.accent}40`, borderLeft: `4px solid ${product.accent}`, borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>👩‍🎨</span>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: product.accent }}>{t('womenAndHeritage')}</span>
              <span style={{ background: product.accent, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontFamily: "'Lato', sans-serif" }}>{product.women_percent}% {t('women')}</span>
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', lineHeight: 1.8, color: '#3A1C08', margin: 0 }}>{product.women_role}</p>
          </div>

          {/* History */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1rem' }}>📜</span>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B4820' }}>{t('historyAndHeritage')}</span>
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', lineHeight: 1.85, color: '#3A1C08', margin: 0 }}>{product.history}</p>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#FFF5E0', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A07840', marginBottom: 6 }}>{t('materials')}</div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', color: '#3A1C08', lineHeight: 1.6, margin: 0 }}>{product.materials}</p>
            </div>
            <div style={{ background: '#FFF5E0', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A07840', marginBottom: 6 }}>{t('districts')}</div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', color: '#3A1C08', lineHeight: 1.6, margin: 0 }}>{product.district}</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #EDD060' }}>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8rem', color: '#A07840' }}>{product.gi_tag} · {t('certified')} {product.year}</div>
            <Link href={`/shop?state=${encodeURIComponent(product.state)}`} style={{ background: '#E8380A', color: '#fff', fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: 6, textDecoration: 'none' }}>
              {t('shopProductsPrefix')}{product.state}{t('shopProductsSuffix')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GIProductsClient({ products }: { products: GIProduct[] }) {
  const { t } = useTranslation('giProducts')
  const { t: tc } = useTranslation('common')
  const categoryLabels: Record<string, string> = {
    textile: t('categoryTextile'), handicraft: t('categoryHandicraft'), agricultural: tc('agricultural'), food: tc('foodAndNatural'),
  }
  const [activeState, setActiveState] = useState('All States')
  const [selectedProduct, setSelectedProduct] = useState<GIProduct | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const allStates = ['All States', ...Array.from(new Set(products.map(p => p.state))).sort()]

  const filtered = products.filter(p => {
    const matchState = activeState === 'All States' || p.state === activeState
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    return matchState && matchSearch
  })

  const stateCount = (state: string) =>
    state === 'All States' ? products.length : products.filter(p => p.state === state).length

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #1B2E4A 0%, #0D1E33 100%)', padding: '4rem 5% 5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, pointerEvents: 'none' }}>
          <svg width="420" height="420" viewBox="0 0 420 420" fill="none">
            <circle cx="210" cy="210" r="200" stroke="#D4A000" strokeWidth="1" />
            <circle cx="210" cy="210" r="160" stroke="#D4A000" strokeWidth="1" />
            <circle cx="210" cy="210" r="120" stroke="#D4A000" strokeWidth="1" />
            <circle cx="210" cy="210" r="80" stroke="#D4A000" strokeWidth="1" />
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(angle => (
              <line key={angle} x1="210" y1="10" x2="210" y2="210" stroke="#D4A000" strokeWidth="0.5" transform={`rotate(${angle} 210 210)`} />
            ))}
          </svg>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '0.75rem' }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>{tc('home')}</Link>
            <span style={{ margin: '0 0.5rem', opacity: 0.6 }}>/</span>{tc('giProducts')}
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: '1rem' }}>
            {t('heroTitlePrefix')}<span style={{ color: '#D4A000', fontStyle: 'italic' }}>{t('heroTitleAccent')}</span>
          </h1>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, maxWidth: 640, marginBottom: '2rem' }}>
            {t('heroDescription')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {[{ n: '478', l: t('statGiTags') }, { n: String(products.length), l: t('statProductsProfiled') }, { n: '16', l: t('statStatesCovered') }, { n: '2,500+', l: t('statWomenVoices') }].map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#D4A000', lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #DDB840', position: 'sticky', top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 4%' }}>
          <div style={{ overflowX: 'auto', display: 'flex', gap: '0.15rem', padding: '0.75rem 0', scrollbarWidth: 'none' }}>
            {allStates.map(state => {
              const active = state === activeState
              return (
                <button key={state} onClick={() => setActiveState(state)} style={{ flexShrink: 0, fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em', padding: '7px 14px', borderRadius: 6, border: active ? '1.5px solid #E8380A' : '1.5px solid transparent', background: active ? '#E8380A' : 'transparent', color: active ? '#fff' : '#6B4820', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {state === 'All States' ? t('allStatesLabel') : state}
                  <span style={{ marginLeft: 6, background: active ? 'rgba(255,255,255,0.25)' : '#EDD060', color: active ? '#fff' : '#9B6820', borderRadius: 10, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {stateCount(state)}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ padding: '0.6rem 0', borderTop: '1px solid #EDD060' }}>
            <input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', maxWidth: 480, fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', padding: '8px 14px', border: '1.5px solid #DDB840', borderRadius: 8, background: '#FFFFFF', color: '#1B2E4A', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2.5rem 4%' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', color: '#9B6820', margin: 0 }}>
            {t('showing')} <strong style={{ color: '#1B2E4A' }}>{filtered.length}</strong> {t(filtered.length !== 1 ? 'giCertifiedProducts' : 'giCertifiedProduct')}
            {activeState !== 'All States' && <> {t('from')} <strong style={{ color: '#E8380A' }}>{activeState}</strong></>}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${CATEGORY_COLORS[key]}15`, color: CATEGORY_COLORS[key], border: `1px solid ${CATEGORY_COLORS[key]}30` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLORS[key], display: 'inline-block' }} />{label}
              </span>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', color: '#6B4820' }}>{t('noProductsFoundTitle')}</p>
            <button onClick={() => { setSearchQuery(''); setActiveState('All States') }} style={{ marginTop: '1rem', background: '#E8380A', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: "'Lato', sans-serif", fontWeight: 700 }}>{t('clearFilters')}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(product => (
              <div key={product.id} onClick={() => setSelectedProduct(product)}
                style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <CardVisual product={product} />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A07840', marginBottom: '0.35rem' }}>{product.state}</div>
                  <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1B2E4A', margin: '0 0 0.5rem' }}>{product.name}</h3>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.82rem', color: '#6B4820', lineHeight: 1.6, margin: '0 0 1rem' }}>{product.tagline}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${product.accent}12`, border: `1px solid ${product.accent}35`, borderRadius: 20, padding: '4px 10px', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem' }}>👩‍🎨</span>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: product.accent }}>{product.women_percent}{t('womenArtisansSuffix')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #EDD060' }}>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.68rem', color: '#D4A000', fontWeight: 700 }}>{product.gi_tag}</span>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#E8380A', letterSpacing: '0.05em' }}>{t('learnMore')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Knowledge Banner */}
      <div style={{ background: '#1B2E4A', padding: '4rem 5%', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{t('aiPoweredKnowledge')}</p>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>{t('askChatbotTitle')}</h2>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, maxWidth: 600, margin: '0 auto 2rem' }}>
            {t('askChatbotDescription')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/chatbot" style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: '#E8380A', color: '#fff', padding: '12px 28px', borderRadius: 6, textDecoration: 'none' }}>{t('chatWithAi')}</Link>
            <Link href="/shop" style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'transparent', color: '#D4A000', border: '1.5px solid #D4A000', padding: '12px 28px', borderRadius: 6, textDecoration: 'none' }}>{t('shopGiProducts')}</Link>
          </div>
        </div>
      </div>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      <style>{`
        input::placeholder { color: #A07840; }
        input:focus { border-color: #E8380A !important; box-shadow: 0 0 0 3px rgba(232,56,10,0.12); }
        @media (max-width: 640px) {
          div[style*="repeat(auto-fill, minmax(280px"] { grid-template-columns: 1fr !important; }
          div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
