'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { localizedProductName } from '@/lib/productLocale'

export default function ProductCard({ product }: { product: Product }) {
  const cat = CATEGORY_META[product.category]
  const { t, lang } = useTranslation('shop')
  const { t: tc } = useTranslation('common')
  const name = localizedProductName(product, lang)
  const [added, setAdded] = useState(false)

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cart = JSON.parse(localStorage.getItem('kalastree_cart') || '[]')
    const idx = cart.findIndex((i: { id: string }) => i.id === product.id)
    if (idx >= 0) cart[idx].qty += 1
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || '', slug: product.slug, qty: 1 })
    localStorage.setItem('kalastree_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 3,
      overflow: 'hidden', transition: 'transform 0.25s, box-shadow 0.25s',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-6px)'
        el.style.boxShadow = '0 16px 40px rgba(30,95,116,0.14)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <Link href={`/shop/${product.slug}`} style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
        {/* Image */}
        <div style={{ height: 170, background: `linear-gradient(135deg, ${cat.bg}, #FFFFFF)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3rem' }}>{cat.icon}</span>
          )}
          {product.gi_tag && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <span className="gi-badge">✦ {t('giTagged')}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '0.85rem 0.95rem 0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cat.color, marginBottom: 3 }}>
            {cat.icon} {cat.label}
          </div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.02rem', fontWeight: 600, color: '#16303A', marginBottom: 3, lineHeight: 1.3 }}>
            {name}
          </div>
          {product.artisan && (
            <div style={{ fontSize: '0.74rem', color: '#5B7480', marginBottom: 6 }}>
              {t('byPrefix')}{product.artisan.name}{t('bySuffix')} · {product.state}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1E5F74' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.7rem', color: product.stock > 0 ? '#1A7A32' : '#1E5F74', fontWeight: 700 }}>
              {product.stock > 0 ? <>{product.stock}{t('stockLeftSuffix')}</> : t('outOfStock')}
            </span>
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div style={{ padding: '0.7rem 0.95rem 0.85rem' }}>
        <button
          onClick={product.stock > 0 ? addToCart : undefined}
          disabled={product.stock === 0}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 3, border: 'none',
            fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
            cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
            background: product.stock === 0 ? '#DCE4E6' : added ? '#1A7A32' : '#1E5F74',
            color: product.stock === 0 ? '#5B7480' : '#fff',
            transition: 'background 0.2s',
          }}
        >
          {product.stock === 0 ? t('outOfStock') : added ? `✓ ${t('addedToCart')}` : tc('addToCart')}
        </button>
      </div>
    </div>
  )
}
