'use client'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function ProductCard({ product }: { product: Product }) {
  const cat = CATEGORY_META[product.category]
  const { t } = useTranslation('shop')

  return (
    <Link href={`/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10,
        overflow: 'hidden', transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-6px)'
          el.style.boxShadow = '0 16px 40px rgba(232,56,10,0.12)'
          el.style.borderColor = '#E8380A'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          el.style.borderColor = '#DDB840'
        }}
      >
        {/* Image */}
        <div style={{ height: 200, background: `linear-gradient(135deg, ${cat.bg}, #FFF8EE)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3.5rem' }}>{cat.icon}</span>
          )}
          {product.gi_tag && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span className="gi-badge">✦ {t('giTagged')}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '1rem 1.1rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cat.color, marginBottom: 4 }}>
            {cat.icon} {cat.label}
          </div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 4, lineHeight: 1.3 }}>
            {product.name}
          </div>
          {product.artisan && (
            <div style={{ fontSize: '0.78rem', color: '#6B4820', marginBottom: 8 }}>
              {t('byPrefix')}{product.artisan.name}{t('bySuffix')} · {product.state}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 700, color: '#E8380A' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.72rem', color: product.stock > 0 ? '#1A7A32' : '#E8380A', fontWeight: 700 }}>
              {product.stock > 0 ? <>{product.stock}{t('stockLeftSuffix')}</> : t('outOfStock')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
