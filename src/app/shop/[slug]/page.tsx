'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import Link from 'next/link'

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  source: 'upload' | 'youtube'
  sort_order: number
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/)
  return m ? m[1] : null
}

function MediaViewer({ item, productName }: { item: MediaItem; productName: string }) {
  if (item.type === 'video' && item.source === 'youtube') {
    const id = extractYouTubeId(item.url)
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0`}
        title={productName}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    )
  }
  if (item.type === 'video' && item.source === 'upload') {
    return (
      <video
        src={item.url}
        controls
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
      />
    )
  }
  return <img src={item.url} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
}

function MediaThumbnail({ item }: { item: MediaItem }) {
  if (item.type === 'video' && item.source === 'youtube') {
    const id = extractYouTubeId(item.url)
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="YouTube" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '1rem' }}>▶</span>
        </div>
      </div>
    )
  }
  if (item.type === 'video' && item.source === 'upload') {
    return (
      <div style={{ width: '100%', height: '100%', background: '#1B2E4A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.2rem' }}>🎥</span>
      </div>
    )
  }
  return <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: prod } = await supabase
        .from('products')
        .select('*, artisan:artisans(*)')
        .eq('slug', slug)
        .single()
      const typedProd = prod as unknown as Product
      setProduct(typedProd)

      if (typedProd) {
        const { data: mediaData } = await supabase
          .from('product_media')
          .select('*')
          .eq('product_id', typedProd.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })

        if (mediaData && mediaData.length > 0) {
          setMedia(mediaData as MediaItem[])
        } else if (typedProd.images?.length > 0) {
          setMedia(typedProd.images.map((url: string, i: number) => ({
            id: `legacy-${i}`, url, type: 'image' as const, source: 'upload' as const, sort_order: i,
          })))
        }
      }
      setLoading(false)
    }
    load()
  }, [slug])

  const addToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('kalastree_cart') || '[]')
    const idx = cart.findIndex((i: { id: string }) => i.id === product.id)
    const coverImg = media[0]?.type === 'image' ? media[0].url : (product.images?.[0] || '')
    if (idx >= 0) cart[idx].qty += qty
    else cart.push({ id: product.id, name: product.name, price: product.price, image: coverImg, slug: product.slug, qty })
    localStorage.setItem('kalastree_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B4820', fontSize: '1.1rem' }}>Loading...</div>
  if (!product) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p>Product not found.</p>
      <Link href="/shop" style={{ color: '#E8380A' }}>← Back to Shop</Link>
    </div>
  )

  const cat = CATEGORY_META[product.category]
  const activeItem = media[activeIdx]

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#FFE8A8', padding: '0.75rem 5%', fontSize: '0.78rem', color: '#6B4820' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/" style={{ color: '#6B4820', textDecoration: 'none' }}>Home</Link> {' / '}
          <Link href="/shop" style={{ color: '#6B4820', textDecoration: 'none' }}>Shop</Link> {' / '}
          <Link href={`/shop?category=${product.category}`} style={{ color: '#6B4820', textDecoration: 'none' }}>{cat.label}</Link> {' / '}
          <span style={{ color: '#1B2E4A', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 5%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>

        {/* Media column */}
        <div>
          {/* Main viewer */}
          <div style={{ borderRadius: 12, overflow: 'hidden', background: activeItem?.type === 'video' ? '#000' : cat.bg, height: 420, border: '1.5px solid #DDB840', marginBottom: '0.75rem', position: 'relative' }}>
            {activeItem ? (
              <MediaViewer item={activeItem} productName={product.name} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '5rem' }}>{cat.icon}</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {media.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {media.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIdx(i)}
                  style={{
                    flexShrink: 0, width: 72, height: 72, borderRadius: 8,
                    overflow: 'hidden', padding: 0,
                    border: `2px solid ${i === activeIdx ? '#E8380A' : '#DDB840'}`,
                    cursor: 'pointer', background: 'none',
                  }}
                >
                  <MediaThumbnail item={item} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details column */}
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
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFE8A8', border: '2px solid #D4A000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {product.artisan.photo_url
                  ? <img src={product.artisan.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>👩‍🎨</span>}
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1B2E4A' }}>by {product.artisan.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B4820' }}>{product.artisan.craft} · {product.artisan.state}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#E8380A' }}>View profile →</span>
            </Link>
          )}

          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#E8380A', marginBottom: '0.5rem' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#1A7A32', fontWeight: 700, marginBottom: '1.5rem' }}>
            {product.stock > 0 ? `✓ ${product.stock} in stock · Ships directly from artisan` : '✗ Out of stock'}
          </p>

          {product.description && (
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#6B4820', marginBottom: '1.5rem' }}>{product.description}</p>
          )}

          {/* Qty + Add to Cart */}
          {product.stock > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #DDB840', borderRadius: 6, overflow: 'hidden' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6B4820' }}>−</button>
                <span style={{ padding: '0 16px', fontWeight: 700, color: '#1B2E4A', minWidth: 40, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6B4820' }}>+</button>
              </div>
              <button onClick={addToCart} style={{ flex: 1, background: added ? '#1A7A32' : '#E8380A', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s', minWidth: 180 }}>
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          <button onClick={() => router.push('/cart')} style={{ width: '100%', background: '#1B2E4A', color: '#fff', padding: '12px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
            Buy Now →
          </button>

          {/* Trust signals */}
          <div style={{ borderTop: '1.5px solid #DDB840', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { icon: '✅', text: 'GI Registry Verified' },
              { icon: '💳', text: 'Direct to Artisan Payment' },
              { icon: '📦', text: 'Handmade & Authentic' },
              { icon: '🔄', text: '7-day Easy Returns' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ fontSize: '0.8rem', color: '#6B4820', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="gap: 4rem"] { gap: 2rem !important; }
        }
        div[style*="overflow-x: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
