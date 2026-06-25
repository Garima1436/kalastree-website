'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import Link from 'next/link'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    supabase.from('products').select('*, artisan:artisans(*)').eq('slug', slug).single()
      .then(({ data }) => { setProduct(data as unknown as Product); setLoading(false) })
  }, [slug])

  const addToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('kalastree_cart') || '[]')
    const idx = cart.findIndex((i: { id: string }) => i.id === product.id)
    if (idx >= 0) cart[idx].qty += qty
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || '', slug: product.slug, qty })
    localStorage.setItem('kalastree_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5542', fontSize: '1.1rem' }}>Loading...</div>
  if (!product) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}><p>Product not found.</p><Link href="/shop" style={{ color: '#C94B1A' }}>← Back to Shop</Link></div>

  const cat = CATEGORY_META[product.category]

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#F2E8D5', padding: '0.75rem 5%', fontSize: '0.78rem', color: '#5C5542' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/" style={{ color: '#5C5542', textDecoration: 'none' }}>Home</Link> {' / '}
          <Link href="/shop" style={{ color: '#5C5542', textDecoration: 'none' }}>Shop</Link> {' / '}
          <Link href={`/shop?category=${product.category}`} style={{ color: '#5C5542', textDecoration: 'none' }}>{cat.label}</Link> {' / '}
          <span style={{ color: '#1B2E4A', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 5%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
        {/* Images */}
        <div>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: cat.bg, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #D9C9A8', marginBottom: '1rem' }}>
            {product.images?.[activeImg]
              ? <img src={product.images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '5rem' }}>{cat.icon}</span>
            }
          </div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === activeImg ? '#C94B1A' : '#D9C9A8'}`, cursor: 'pointer', background: 'none', padding: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span className="gi-badge">✦ {product.gi_tag || 'GI Tagged'}</span>
            <span style={{ background: cat.bg, color: cat.color, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${cat.color}40` }}>{cat.icon} {cat.label}</span>
          </div>

          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1B2E4A', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {product.name}
          </h1>

          {product.artisan && (
            <Link href={`/artisans/${product.artisan.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: '1.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F2E8D5', border: '2px solid #B8860B', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {product.artisan.photo_url
                  ? <img src={product.artisan.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>👩‍🎨</span>
                }
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1B2E4A' }}>by {product.artisan.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#5C5542' }}>{product.artisan.craft} · {product.artisan.state}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#C94B1A' }}>View profile →</span>
            </Link>
          )}

          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#C94B1A', marginBottom: '0.5rem' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#3B5A2F', fontWeight: 700, marginBottom: '1.5rem' }}>
            {product.stock > 0 ? `✓ ${product.stock} in stock · Ships directly from artisan` : '✗ Out of stock'}
          </p>

          {product.description && (
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#5C5542', marginBottom: '1.5rem' }}>{product.description}</p>
          )}

          {/* Qty + Add to Cart */}
          {product.stock > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #D9C9A8', borderRadius: 6, overflow: 'hidden' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#5C5542' }}>−</button>
                <span style={{ padding: '0 16px', fontWeight: 700, color: '#1B2E4A', minWidth: 40, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#5C5542' }}>+</button>
              </div>
              <button onClick={addToCart} style={{ flex: 1, background: added ? '#3B5A2F' : '#C94B1A', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s', minWidth: 180 }}>
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          <button onClick={() => router.push('/cart')} style={{ width: '100%', background: '#1B2E4A', color: '#fff', padding: '12px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
            Buy Now →
          </button>

          {/* Trust signals */}
          <div style={{ borderTop: '1.5px solid #D9C9A8', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { icon: '✅', text: 'GI Registry Verified' },
              { icon: '💳', text: 'Direct to Artisan Payment' },
              { icon: '📦', text: 'Handmade & Authentic' },
              { icon: '🔄', text: '7-day Easy Returns' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ fontSize: '0.8rem', color: '#5C5542', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
