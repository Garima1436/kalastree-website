'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_META, SUBCATEGORY_META, type Category } from '@/lib/types'
import { INDIAN_STATES } from '@/lib/indian-states'

type SortKey = 'featured' | 'price_asc' | 'price_desc'
type View = 'root' | 'category'

interface Labels {
  filterAndSort: string
  state: string
  category: string
  sortBy: string
  sortFeatured: string
  sortPriceLowHigh: string
  sortPriceHighLow: string
  removeAll: string
  apply: string
  allStates: string
  allProducts: string
  productWord: string
  productsWord: string
}

const rowStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '16px 20px', background: 'none', border: 'none', borderBottom: '1px solid #EDE6D0',
  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#1B2E4A', cursor: 'pointer', textAlign: 'left' as const,
}

function OptionRow({ label, active, onClick, indent }: { label: string; active: boolean; onClick: () => void; indent?: boolean }) {
  return (
    <button onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'left', padding: indent ? '10px 20px' : '14px 20px', background: active ? '#FFF5E0' : 'none', border: 'none', borderBottom: '1px solid #F3EDD8', fontFamily: "'Inter', sans-serif", fontWeight: active ? 700 : 500, fontSize: indent ? '0.85rem' : '0.92rem', color: active ? '#E8380A' : '#1B2E4A', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function CategoryRow({ label, active, expanded, onSelect, onToggle }: { label: string; active: boolean; expanded: boolean; onSelect: () => void; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', background: active ? '#FFF5E0' : 'none', borderBottom: '1px solid #F3EDD8' }}>
      <button onClick={onSelect} style={{ flex: 1, textAlign: 'left', padding: '14px 20px', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontWeight: active ? 700 : 500, fontSize: '0.92rem', color: active ? '#E8380A' : '#1B2E4A', cursor: 'pointer' }}>
        {label}
      </button>
      <button onClick={onToggle} aria-label={expanded ? 'Collapse' : 'Expand'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 18px', fontSize: '0.65rem', color: active ? '#E8380A' : '#A07840' }}>
        {expanded ? '▲' : '▼'}
      </button>
    </div>
  )
}

export default function MobileFilterSheet({
  currentCategory, currentSubcategory, currentState, currentSort, currentQ, productCount, labels,
}: {
  currentCategory?: Category
  currentSubcategory?: string
  currentState?: string
  currentSort?: string
  currentQ?: string
  productCount: number
  labels: Labels
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('root')
  const [pendingCategory, setPendingCategory] = useState(currentCategory)
  const [pendingSubcategory, setPendingSubcategory] = useState(currentSubcategory)
  const [pendingState, setPendingState] = useState(currentState)
  const [pendingSort, setPendingSort] = useState<SortKey>((currentSort as SortKey) ?? 'featured')
  const [expandedCategory, setExpandedCategory] = useState<Category | undefined>(currentCategory)
  const [stateOpen, setStateOpen] = useState(false)

  const openSheet = () => {
    setPendingCategory(currentCategory)
    setPendingSubcategory(currentSubcategory)
    setPendingState(currentState)
    setPendingSort((currentSort as SortKey) ?? 'featured')
    setExpandedCategory(currentCategory)
    setStateOpen(false)
    setView('root')
    setOpen(true)
  }

  const buildUrl = (category?: string, subcategory?: string, state?: string, sort?: SortKey) => {
    const p = new URLSearchParams()
    if (category) p.set('category', category)
    if (subcategory) p.set('subcategory', subcategory)
    if (state) p.set('state', state)
    if (sort && sort !== 'featured') p.set('sort', sort)
    if (currentQ) p.set('q', currentQ)
    const qs = p.toString()
    return qs ? `/shop?${qs}` : '/shop'
  }

  const apply = () => {
    router.push(buildUrl(pendingCategory, pendingSubcategory, pendingState, pendingSort))
    setOpen(false)
  }

  const removeAll = () => {
    router.push(buildUrl())
    setOpen(false)
  }

  const categoryValueLabel = pendingSubcategory
    ? SUBCATEGORY_META[pendingCategory as Category]?.find(sc => sc.value === pendingSubcategory)?.label ?? labels.allProducts
    : pendingCategory ? CATEGORY_META[pendingCategory].label : labels.allProducts

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'featured', label: labels.sortFeatured },
    { value: 'price_asc', label: labels.sortPriceLowHigh },
    { value: 'price_desc', label: labels.sortPriceHighLow },
  ]

  const countLabel = `${productCount} ${productCount === 1 ? labels.productWord : labels.productsWord}`

  return (
    <>
      <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 5%', background: '#FFFFFF', borderTop: '1px solid #E5DCC0', borderBottom: '1px solid #E5DCC0' }}>
        <button onClick={openSheet} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#1B2E4A', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M7 12h10M10 17h4"/></svg>
          {labels.filterAndSort}
        </button>
        <span style={{ fontSize: '0.8rem', color: '#6B4820', fontFamily: "'Inter', sans-serif" }}>{countLabel}</span>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(26,10,0,0.45)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '85%', maxWidth: 340, background: '#FFFFFF', boxShadow: '8px 0 32px rgba(26,10,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #E5DCC0' }}>
            {view !== 'root' && (
              <button onClick={() => setView('root')} aria-label="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 10, fontSize: '1.1rem', color: '#1B2E4A' }}>←</button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#1B2E4A' }}>
                {view === 'root' ? labels.filterAndSort : labels.category}
              </div>
              {view === 'root' && <div style={{ fontSize: '0.78rem', color: '#A07840', marginTop: 2 }}>{countLabel}</div>}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#1B2E4A', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {view === 'root' && (
              <div>
                <div style={{ borderBottom: '1px solid #EDE6D0' }}>
                  <button onClick={() => setStateOpen(v => !v)} style={{ ...rowStyle, borderBottom: 'none' }}>
                    <span>{labels.state}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A07840', fontSize: '0.82rem', fontWeight: 400 }}>
                      {pendingState || labels.allStates}
                      <span style={{ color: '#1B2E4A', fontSize: '0.6rem' }}>{stateOpen ? '▲' : '▼'}</span>
                    </span>
                  </button>
                  {stateOpen && (
                    <div style={{ maxHeight: 240, overflowY: 'auto', background: '#FFFDF5' }}>
                      <OptionRow indent active={!pendingState} label={labels.allStates} onClick={() => { setPendingState(undefined); setStateOpen(false) }} />
                      {INDIAN_STATES.map(state => (
                        <OptionRow key={state} indent active={pendingState === state} label={state} onClick={() => { setPendingState(state); setStateOpen(false) }} />
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setView('category')} style={rowStyle}>
                  <span>{labels.category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A07840', fontSize: '0.82rem', fontWeight: 400 }}>{categoryValueLabel} <span style={{ color: '#1B2E4A' }}>→</span></span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #EDE6D0' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#1B2E4A' }}>{labels.sortBy}</span>
                  <select value={pendingSort} onChange={e => setPendingSort(e.target.value as SortKey)} style={{ border: 'none', background: 'none', color: '#6B4820', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }}>
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {view === 'category' && (
              <div>
                <OptionRow active={!pendingCategory} label={labels.allProducts}
                  onClick={() => { setPendingCategory(undefined); setPendingSubcategory(undefined); setExpandedCategory(undefined); setView('root') }} />
                {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
                  <div key={key}>
                    <CategoryRow
                      active={pendingCategory === key && !pendingSubcategory}
                      expanded={expandedCategory === key}
                      label={`${meta.icon} ${meta.label}`}
                      onSelect={() => { setPendingCategory(key); setPendingSubcategory(undefined); setExpandedCategory(prev => (prev === key ? undefined : key)) }}
                      onToggle={() => setExpandedCategory(prev => (prev === key ? undefined : key))}
                    />
                    {expandedCategory === key && (
                      <div style={{ paddingLeft: 20 }}>
                        <OptionRow indent active={pendingCategory === key && !pendingSubcategory} label={`${labels.allProducts} — ${meta.label}`}
                          onClick={() => { setPendingCategory(key); setPendingSubcategory(undefined) }} />
                        {SUBCATEGORY_META[key].map(sc => (
                          <OptionRow key={sc.value} indent active={pendingSubcategory === sc.value} label={sc.label}
                            onClick={() => { setPendingCategory(key); setPendingSubcategory(sc.value) }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid #E5DCC0', gap: 12 }}>
            <button onClick={removeAll} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: '#1B2E4A', cursor: 'pointer' }}>
              {labels.removeAll}
            </button>
            <button onClick={apply} style={{ flex: 1, maxWidth: 220, background: '#E8380A', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>
              {labels.apply}
            </button>
          </div>
          </div>
        </div>
      )}
    </>
  )
}
