'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { localizedGiField } from '@/lib/giProductLocale'
import Reveal from '@/components/Reveal'

export interface GIProduct {
  id: string
  name: string
  name_hi: string | null
  state: string
  gi_tag: string
  year: string
  category: 'textile' | 'handicraft' | 'agricultural' | 'food'
  // Most of these are only populated for the small set of entries someone
  // has actually curated — the bulk-imported rows sourced directly from the
  // official IP India registry have real name/state/gi_tag/year/category
  // (verified facts) but no written narrative content, since that would
  // mean inventing a tagline/history/women's-role claim rather than
  // reporting one. Every render below treats these as optional.
  accent: string | null
  emoji: string | null
  tagline: string | null
  tagline_hi: string | null
  women_role: string | null
  women_role_hi: string | null
  history: string | null
  history_hi: string | null
  materials: string | null
  materials_hi: string | null
  district: string | null
  women_percent: number | null
  image_url: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  textile: '#1B2E4A', handicraft: '#E8380A', agricultural: '#1A7A32', food: '#C21859',
}
const DEFAULT_ACCENT = '#6B4820'
const DEFAULT_EMOJI = '🏷️'
// Most of the registry-sourced products have no photo of their own — show
// the official GI tag mark instead of a blank/emoji-only tile.
const DEFAULT_IMAGE = '/DISPLAYGITAG.jpeg'
const PAGE_SIZE = 24

// Windowed page-number list: always show first/last, the current page and
// its immediate neighbors, collapsing everything else into an ellipsis —
// otherwise a 648-product catalogue would render 27 page buttons at once.
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis')
    result.push(sorted[i])
  }
  return result
}

// There's no reliable DB relationship between a gi_products row and the
// shop products it corresponds to (products.gi_tag is largely unpopulated —
// a known data gap in this project), so linking "shop this GI product" to
// matching listings falls back to the same distinctive-keyword full-text
// search the chatbot already uses for the identical problem (see
// retrieval.ts's retrieveCandidateProducts). Deliberately NOT also scoped
// by state — a state mismatch between the GI entry and a real product row
// would silently hide true matches rather than just widen the result set.
function giSearchKeyword(englishName: string): string {
  const withoutParens = englishName.replace(/\([^)]*\)/g, '').trim()
  return withoutParens.split(/\s+/)[0] || englishName
}

function CardVisual({ product }: { product: GIProduct }) {
  const { t, lang } = useTranslation('giProducts')
  const { t: tc } = useTranslation('common')
  const name = localizedGiField(product.name, product.name_hi, lang)
  const accent = product.accent ?? DEFAULT_ACCENT
  const categoryLabels: Record<string, string> = {
    textile: t('categoryTextile'), handicraft: t('categoryHandicraft'), agricultural: tc('agricultural'), food: tc('foodAndNatural'),
  }
  return (
    <div className="relative h-[200px] overflow-hidden rounded-t-[10px] max-sm:h-[120px]" style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}30)` }}>
      <Image src={product.image_url || DEFAULT_IMAGE} alt={name} fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
        style={{ objectFit: 'cover' }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
      <div className="absolute top-2.5 left-2.5 max-w-[58%] truncate rounded font-sans text-[0.62rem] font-bold tracking-[0.1em] text-white uppercase max-sm:max-w-[50%] max-sm:text-[0.52rem] max-sm:tracking-[0.05em]" style={{ background: CATEGORY_COLORS[product.category], padding: '3px 8px' }}>
        {categoryLabels[product.category]}
      </div>
    </div>
  )
}

function ProductModal({ product, onClose }: { product: GIProduct; onClose: () => void }) {
  const { t, lang } = useTranslation('giProducts')
  const name = localizedGiField(product.name, product.name_hi, lang)
  const womenRole = localizedGiField(product.women_role, product.women_role_hi, lang)
  const history = localizedGiField(product.history, product.history_hi, lang)
  const materials = localizedGiField(product.materials, product.materials_hi, lang)
  const accent = product.accent ?? DEFAULT_ACCENT
  const emoji = product.emoji ?? DEFAULT_EMOJI
  // Most of the 823 registry-sourced products have real name/state/gi_tag/
  // year but no written narrative (that would mean inventing a claim, not
  // reporting one) — so these sections only render when there's something
  // real to show, rather than a heading over an empty paragraph.
  const hasWomenSection = womenRole || product.women_percent != null
  const hasMaterialsOrDistrict = materials || product.district
  const hasAnyDetail = hasWomenSection || history || hasMaterialsOrDistrict
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const titleId = `gi-modal-title-${product.id}`

  // Focus the close button on open, restore focus to whatever triggered
  // the modal on close, trap Tab within the dialog while open, and close
  // on Escape — none of this existed before (plain div with no dialog
  // semantics at all), so keyboard/screen-reader users had no way in or
  // out short of finding the ✕ by mouse.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeBtnRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,5,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div ref={dialogRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={titleId}
        style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', border: '1.5px solid #DDB840' }}>
        {/* Header */}
        {product.image_url ? (
          <div style={{ height: 200, background: `linear-gradient(135deg, ${accent}25, ${accent}45)`, borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '0 2rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
            <Image src={product.image_url} alt={name} fill sizes="720px"
              style={{ objectFit: 'cover', opacity: 0.35 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))', position: 'relative', zIndex: 1 }}>{emoji}</span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', opacity: 0.8, marginBottom: 4 }}>{product.state} · {product.year}</div>
              <h2 id={titleId} style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{name}</h2>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{product.gi_tag}</div>
            </div>
            <button ref={closeBtnRef} onClick={onClose} aria-label={t('closeAria')} style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B4820', fontWeight: 700 }}>✕</button>
          </div>
        ) : (
          // No real photo for this product — show the full default GI tag
          // graphic on its own (never cropped or overlapped by text), with
          // the title/state/year in a separate band below it instead of
          // layered on top.
          <div style={{ borderRadius: '14px 14px 0 0', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: 200, background: '#F3EEE6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Image src={DEFAULT_IMAGE} alt={name} fill sizes="720px" style={{ objectFit: 'cover' }} />
              <button ref={closeBtnRef} onClick={onClose} aria-label={t('closeAria')} style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B4820', fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${accent}25, ${accent}45)`, padding: '1rem 2rem 1.25rem' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', opacity: 0.85, marginBottom: 4 }}>{product.state} · {product.year}</div>
              <h2 id={titleId} style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{name}</h2>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{product.gi_tag}</div>
            </div>
          </div>
        )}

        <div style={{ padding: hasAnyDetail ? '2rem' : '1.25rem 2rem' }}>
          {/* Women involvement */}
          {hasWomenSection && (
            <div style={{ background: 'linear-gradient(135deg, #FFF5F0, #FFF8F2)', border: `1.5px solid ${accent}40`, borderLeft: `4px solid ${accent}`, borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>👩‍🎨</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>{t('womenAndHeritage')}</span>
                {product.women_percent != null && (
                  <span style={{ background: accent, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontFamily: "'Inter', sans-serif" }}>{product.women_percent}% {t('women')}</span>
                )}
              </div>
              {womenRole && <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', lineHeight: 1.8, color: '#3A1C08', margin: 0 }}>{womenRole}</p>}
            </div>
          )}

          {/* History */}
          {history && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>📜</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B4820' }}>{t('historyAndHeritage')}</span>
              </div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', lineHeight: 1.85, color: '#3A1C08', margin: 0 }}>{history}</p>
            </div>
          )}

          {/* Details */}
          {hasMaterialsOrDistrict && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {materials && (
                <div style={{ background: '#FFF5E0', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A07840', marginBottom: 6 }}>{t('materials')}</div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: '#3A1C08', lineHeight: 1.6, margin: 0 }}>{materials}</p>
                </div>
              )}
              {product.district && (
                <div style={{ background: '#FFF5E0', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A07840', marginBottom: 6 }}>{t('districts')}</div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: '#3A1C08', lineHeight: 1.6, margin: 0 }}>{product.district}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: hasAnyDetail ? '1.5rem' : 0, paddingTop: hasAnyDetail ? '1.25rem' : 0, borderTop: hasAnyDetail ? '1px solid #EDD060' : 'none' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: '#A07840' }}>{product.gi_tag} · {t('certified')} {product.year}</div>
            <Link href={`/shop?q=${encodeURIComponent(giSearchKeyword(product.name))}`} style={{ background: '#E8380A', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: 6, textDecoration: 'none' }}>
              {t('shopProductsPrefix')}{name}{t('shopProductsSuffix')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'name' | 'year' | 'women'

function FilterOptionRow({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '11px 20px', background: active ? '#FFF5E0' : 'none', border: 'none', borderBottom: '1px solid #F3EDD8', fontFamily: "'Inter', sans-serif", fontWeight: active ? 700 : 500, fontSize: '0.88rem', color: active ? '#E8380A' : '#1B2E4A', cursor: 'pointer' }}>
      <span>{label}</span>
      {count != null && (
        <span style={{ background: active ? '#E8380A' : '#EDD060', color: active ? '#fff' : '#9B6820', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
          {count}
        </span>
      )}
    </button>
  )
}

// Same slide-in filter-drawer pattern as the shop page's MobileFilterSheet
// (button bar + left drawer + Apply/Remove-all footer), adapted to this
// page's simpler filter set (state, flat category, sort — no
// price/subcategory) and wired to the existing local-state filters rather
// than URL params, since this page's filters were never URL-synced.
function GIFilterSheet({
  allStates, stateCounts, activeState, setActiveState,
  activeCategory, setActiveCategory, categoryLabels,
  sortBy, setSortBy, resultCount,
  searchQuery, setSearchQuery,
}: {
  allStates: string[]
  stateCounts: Record<string, number>
  activeState: string
  setActiveState: (s: string) => void
  activeCategory: string | null
  setActiveCategory: (c: string | null) => void
  categoryLabels: Record<string, string>
  sortBy: SortKey
  setSortBy: (s: SortKey) => void
  resultCount: string
  searchQuery: string
  setSearchQuery: (q: string) => void
}) {
  const { t } = useTranslation('giProducts')
  const [open, setOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  const [pendingState, setPendingState] = useState(activeState)
  const [pendingCategory, setPendingCategory] = useState(activeCategory)
  const [pendingSort, setPendingSort] = useState<SortKey>(sortBy)

  const openSheet = () => {
    setPendingState(activeState)
    setPendingCategory(activeCategory)
    setPendingSort(sortBy)
    setStateOpen(false)
    setOpen(true)
  }
  const apply = () => {
    setActiveState(pendingState)
    setActiveCategory(pendingCategory)
    setSortBy(pendingSort)
    setOpen(false)
  }
  const removeAll = () => {
    setActiveState('All States')
    setActiveCategory(null)
    setSortBy('name')
    setOpen(false)
  }

  const sortLabels: Record<SortKey, string> = { name: t('sortByName'), year: t('sortByYear'), women: t('sortByWomen') }

  return (
    <>
      <div className="sticky top-16 z-50" style={{ background: '#fff', borderBottom: '1.5px solid #DDB840' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0.7rem 4%', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="min-w-[180px] max-sm:min-w-[100px]"
            style={{ flex: 1, maxWidth: 480, fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', padding: '9px 14px', border: '1.5px solid #DDB840', borderRadius: 8, background: '#FFFFFF', color: '#1B2E4A', outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={openSheet} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #DDB840', borderRadius: 8, padding: '9px 14px', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#1B2E4A', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M7 12h10M10 17h4" /></svg>
            {t('filterAndSort')}
          </button>
          {/* The grid section right below already shows "Showing X of Y" —
              hide this on narrow screens rather than let it wrap the
              search+button row to a second line. */}
          <span className="max-sm:hidden" style={{ fontSize: '0.8rem', color: '#6B4820', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>{resultCount}</span>
        </div>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(26,10,0,0.45)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '85%', maxWidth: 340, background: '#FFFFFF', boxShadow: '8px 0 32px rgba(26,10,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #E5DCC0' }}>
              <div style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#1B2E4A' }}>{t('filterAndSort')}</div>
              <button onClick={() => setOpen(false)} aria-label={t('closeAria')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#1B2E4A', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ borderBottom: '1px solid #EDE6D0' }}>
                <button onClick={() => setStateOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '15px 20px', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1B2E4A', cursor: 'pointer' }}>
                  <span>{t('filterByState')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A07840', fontSize: '0.8rem', fontWeight: 400 }}>
                    {pendingState === 'All States' ? t('allStatesLabel') : pendingState}
                    <span style={{ color: '#1B2E4A', fontSize: '0.6rem' }}>{stateOpen ? '▲' : '▼'}</span>
                  </span>
                </button>
                {stateOpen && (
                  <div style={{ maxHeight: 220, overflowY: 'auto', background: '#FFFDF5' }}>
                    {allStates.map(state => (
                      <FilterOptionRow key={state} active={pendingState === state}
                        label={state === 'All States' ? t('allStatesLabel') : state}
                        count={stateCounts[state] ?? 0}
                        onClick={() => { setPendingState(state); setStateOpen(false) }} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDE6D0' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1B2E4A', marginBottom: 10 }}>{t('categoryLabel')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => setPendingCategory(null)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${!pendingCategory ? '#E8380A' : '#DDB840'}`, background: !pendingCategory ? '#E8380A' : '#fff', color: !pendingCategory ? '#fff' : '#6B4820', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                    {t('allCategoriesLabel')}
                  </button>
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const active = pendingCategory === key
                    return (
                      <button key={key} onClick={() => setPendingCategory(key)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? CATEGORY_COLORS[key] : '#DDB840'}`, background: active ? CATEGORY_COLORS[key] : '#fff', color: active ? '#fff' : '#6B4820', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1B2E4A' }}>{t('sortByAria')}</span>
                <select value={pendingSort} onChange={e => setPendingSort(e.target.value as SortKey)} style={{ border: '1.5px solid #DDB840', borderRadius: 6, padding: '6px 10px', background: '#fff', color: '#6B4820', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }}>
                  {(Object.keys(sortLabels) as SortKey[]).map(key => <option key={key} value={key}>{sortLabels[key]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid #E5DCC0', gap: 12 }}>
              <button onClick={removeAll} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: '#1B2E4A', cursor: 'pointer' }}>
                {t('removeAllFilters')}
              </button>
              <button onClick={apply} style={{ flex: 1, maxWidth: 200, background: '#E8380A', color: '#fff', border: 'none', borderRadius: 6, padding: '11px 0', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                {t('applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function GIProductsClient({ products }: { products: GIProduct[] }) {
  const { t, lang } = useTranslation('giProducts')
  const { t: tc } = useTranslation('common')
  const categoryLabels: Record<string, string> = {
    textile: t('categoryTextile'), handicraft: t('categoryHandicraft'), agricultural: tc('agricultural'), food: tc('foodAndNatural'),
  }
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeState, setActiveState] = useState('All States')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'women'>('name')

  // The selected product lives in the URL (?product=<id>), not local state,
  // so the modal is shareable/deep-linkable and closes on browser back —
  // previously it was untracked React state with no URL of its own.
  const selectedProductId = searchParams.get('product')
  const selectedProduct = products.find(p => p.id === selectedProductId) ?? null

  const openProduct = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('product', id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const closeProduct = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('product')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const allStates = ['All States', ...Array.from(new Set(products.map(p => p.state))).sort()]
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All States': products.length }
    for (const p of products) counts[p.state] = (counts[p.state] ?? 0) + 1
    return counts
  }, [products])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const result = products.filter(p => {
      const matchState = activeState === 'All States' || p.state === activeState
      const matchCategory = !activeCategory || p.category === activeCategory
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.name_hi?.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      return matchState && matchCategory && matchSearch
    })
    const sorted = [...result]
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'year') sorted.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0))
    else if (sortBy === 'women') sorted.sort((a, b) => (b.women_percent ?? -1) - (a.women_percent ?? -1))
    return sorted
  }, [products, activeState, activeCategory, searchQuery, sortBy])

  // Numbered pagination — the page number lives in the URL (?page=<n>) like
  // the product modal, so a specific page is shareable/bookmarkable and
  // survives browser back/forward.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const requestedPage = parseInt(searchParams.get('page') || '1', 10) || 1
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const gridRef = useRef<HTMLDivElement>(null)

  const goToPage = (n: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (n <= 1) params.delete('page')
    else params.set('page', String(n))
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Changing a filter/search/sort invalidates the current page — jump back
  // to page 1 rather than leaving the user stranded on a now out-of-range
  // or mismatched page. Skips the initial mount so a deep link like
  // /gi-products?page=3 isn't immediately reset before the user does anything.
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return }
    if (searchParams.get('page')) goToPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeState, activeCategory, searchQuery, sortBy])

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="pt-8 px-[5%] pb-10 max-sm:pt-6 max-sm:pb-7" style={{ background: 'linear-gradient(160deg, #1B2E4A 0%, #0D1E33 100%)', position: 'relative', overflow: 'hidden' }}>
        <div className="max-sm:hidden" style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, pointerEvents: 'none' }}>
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
          <p className="mb-3 max-sm:mb-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A000' }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>{tc('home')}</Link>
            <span style={{ margin: '0 0.5rem', opacity: 0.6 }}>/</span>{tc('giProducts')}
          </p>
          <h1 className="mb-2 text-[clamp(2rem,4vw,3rem)] max-sm:mb-2 max-sm:text-[1.7rem]" style={{ fontFamily: "'EB Garamond', serif", fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>
            {t('heroTitlePrefix')}<span style={{ color: '#D4A000', fontStyle: 'italic' }}>{t('heroTitleAccent')}</span>
          </h1>
          <p className="mb-0 max-sm:hidden" style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(0.92rem, 1.5vw, 1.05rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: 640 }}>
            {t('heroDescription')}
          </p>
        </div>
      </div>

      {/* Controls — a single unified search + Filter&Sort bar across every
          screen size (was previously a full desktop row plus a separate
          mobile-only compact bar; now one component handles both). */}
      <GIFilterSheet
        allStates={allStates} stateCounts={stateCounts} activeState={activeState} setActiveState={setActiveState}
        activeCategory={activeCategory} setActiveCategory={setActiveCategory} categoryLabels={categoryLabels}
        sortBy={sortBy} setSortBy={setSortBy}
        resultCount={`${filtered.length} ${t(filtered.length !== 1 ? 'giCertifiedProducts' : 'giCertifiedProduct')}`}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      />

      {/* Grid */}
      <div ref={gridRef} className="pt-10 pb-10 px-[4%] max-sm:pt-4 max-sm:pb-6" style={{ maxWidth: 1300, margin: '0 auto', scrollMarginTop: 140 }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#9B6820', margin: 0 }}>
            {filtered.length > PAGE_SIZE ? (
              <>
                {t('showing')} <strong style={{ color: '#1B2E4A' }}>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> {t('of')} <strong style={{ color: '#1B2E4A' }}>{filtered.length}</strong> {t(filtered.length !== 1 ? 'giCertifiedProducts' : 'giCertifiedProduct')}
              </>
            ) : (
              <>
                {t('showing')} <strong style={{ color: '#1B2E4A' }}>{filtered.length}</strong> {t(filtered.length !== 1 ? 'giCertifiedProducts' : 'giCertifiedProduct')}
              </>
            )}
            {activeState !== 'All States' && <> {t('from')} <strong style={{ color: '#E8380A' }}>{activeState}</strong></>}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const active = activeCategory === key
              return (
                <button key={key} onClick={() => setActiveCategory(active ? null : key)}
                  aria-pressed={active}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', background: active ? CATEGORY_COLORS[key] : `${CATEGORY_COLORS[key]}15`, color: active ? '#fff' : CATEGORY_COLORS[key], border: `1px solid ${active ? CATEGORY_COLORS[key] : `${CATEGORY_COLORS[key]}30`}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : CATEGORY_COLORS[key], display: 'inline-block' }} />{label}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', color: '#6B4820' }}>{t('noProductsFoundTitle')}</p>
            <button onClick={() => { setSearchQuery(''); setActiveState('All States'); setActiveCategory(null) }} style={{ marginTop: '1rem', background: '#E8380A', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{t('clearFilters')}</button>
          </div>
        ) : (
          <Reveal direction="none" className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-sm:grid-cols-2 max-sm:gap-3">
            {paginated.map(product => {
              const tagline = localizedGiField(product.tagline, product.tagline_hi, lang)
              const accent = product.accent ?? DEFAULT_ACCENT
              return (
                <div key={product.id} onClick={() => openProduct(product.id)}
                  role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(product.id) } }}
                  className="cursor-pointer overflow-hidden rounded-xl border border-[#DDB840] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-[180ms] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                >
                  <CardVisual product={product} />
                  <div className="p-5 max-sm:p-[0.85rem]">
                    <div className="mb-[0.35rem] font-sans text-[0.68rem] font-bold tracking-[0.12em] text-[#A07840] uppercase">{product.state}</div>
                    <h3 className="mb-2 font-serif text-[1.2rem] font-bold text-navy max-sm:mb-1 max-sm:text-[0.92rem]">{localizedGiField(product.name, product.name_hi, lang)}</h3>
                    {tagline && <p className="mb-4 line-clamp-2 font-sans text-[0.82rem] leading-[1.6] text-text-muted max-sm:mb-[0.6rem] max-sm:text-[0.72rem]">{tagline}</p>}
                    {product.women_percent != null && (
                      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: `${accent}12`, border: `1px solid ${accent}35` }}>
                        <span className="text-[0.75rem]">👩‍🎨</span>
                        <span className="font-sans text-[0.7rem] font-bold" style={{ color: accent }}>{product.women_percent}{t('womenArtisansSuffix')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[#EDD060] pt-3">
                      <span className="font-sans text-[0.68rem] font-bold text-gold">{product.gi_tag}</span>
                      <span className="font-sans text-[0.72rem] font-bold tracking-[0.05em] text-saffron">{t('learnMore')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </Reveal>
        )}

        {totalPages > 1 && (
          <nav aria-label={t('paginationAria')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '3rem' }}>
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} aria-label={t('firstPageAria')}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 700, padding: '8px 12px', borderRadius: 6, border: '1.5px solid #DDB840', background: '#fff', color: currentPage === 1 ? '#DDB840' : '#6B4820', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
              «« {t('firstPage')}
            </button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label={t('previousPageAria')}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: '1.5px solid #DDB840', background: '#fff', color: currentPage === 1 ? '#DDB840' : '#6B4820', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
              ← {t('previousPage')}
            </button>
            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 6px', color: '#A07840', fontSize: '0.85rem' }}>…</span>
              ) : (
                <button key={p} onClick={() => goToPage(p)} aria-current={p === currentPage ? 'page' : undefined}
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', fontWeight: 700, minWidth: 38, padding: '8px 10px', borderRadius: 6, border: p === currentPage ? '1.5px solid #E8380A' : '1.5px solid #DDB840', background: p === currentPage ? '#E8380A' : '#fff', color: p === currentPage ? '#fff' : '#6B4820', cursor: 'pointer' }}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label={t('nextPageAria')}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: '1.5px solid #DDB840', background: '#fff', color: currentPage === totalPages ? '#DDB840' : '#6B4820', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
              {t('nextPage')} →
            </button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} aria-label={t('lastPageAria')}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 700, padding: '8px 12px', borderRadius: 6, border: '1.5px solid #DDB840', background: '#fff', color: currentPage === totalPages ? '#DDB840' : '#6B4820', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
              {t('lastPage')} »»
            </button>
          </nav>
        )}
      </div>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={closeProduct} />}

      <style>{`
        input::placeholder { color: #A07840; }
        input:focus { border-color: #E8380A !important; box-shadow: 0 0 0 3px rgba(232,56,10,0.12); }
      `}</style>
    </div>
  )
}
