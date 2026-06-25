'use client'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const cat = CATEGORY_META[product.category]

  return (
    <Link href={`/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 10,
        overflow: 'hidden', transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-6px)'
          el.style.boxShadow = '0 16px 40px rgba(201,75,26,0.12)'
          el.style.borderColor = '#C94B1A'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          el.style.borderColor = '#D9C9A8'
        }}
      >
        {/* Image */}
        <div style={{ height: 200, background: `linear-gradient(135deg, ${cat.bg}, #FDF6E3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3.5rem' }}>{cat.icon}</span>
          )}
          {product.gi_tag && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span className="gi-badge">✦ GI Tagged</span>
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
            <div style={{ fontSize: '0.78rem', color: '#5C5542', marginBottom: 8 }}>
              by {product.artisan.name} · {product.state}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 700, color: '#C94B1A' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.72rem', color: product.stock > 0 ? '#3B5A2F' : '#C94B1A', fontWeight: 700 }}>
              {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
