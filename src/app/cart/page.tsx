'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CartItem { id: string; name: string; price: number; image: string; slug: string; qty: number }

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const load = () => {
      try { setCart(JSON.parse(localStorage.getItem('kalastree_cart') || '[]')) }
      catch { setCart([]) }
    }
    load()
    window.addEventListener('cart_updated', load)
    return () => window.removeEventListener('cart_updated', load)
  }, [])

  const updateQty = (id: string, qty: number) => {
    const updated = qty <= 0 ? cart.filter(i => i.id !== id) : cart.map(i => i.id === id ? { ...i, qty } : i)
    setCart(updated)
    localStorage.setItem('kalastree_cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart_updated'))
    if (updated.length === 0) localStorage.removeItem('kalastree_cart_owner')
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  if (!mounted) return null

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh', padding: '3rem 5%' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.5rem' }}>Your Cart</h1>
        <p style={{ color: '#5C5542', marginBottom: '2.5rem' }}>{count} item{count !== 1 ? 's' : ''}</p>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#5C5542' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🛒</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', marginBottom: '1.5rem' }}>Your cart is empty.</p>
            <Link href="/shop" style={{ background: '#C94B1A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
              Browse GI Products →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 10, padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ width: 90, height: 90, borderRadius: 8, background: '#F2E8D5', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🏺</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/shop/${item.slug}`} style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: '#1B2E4A', textDecoration: 'none', display: 'block', marginBottom: 4 }}>{item.name}</Link>
                    <span className="gi-badge" style={{ marginBottom: 8, display: 'inline-flex' }}>✦ GI Tagged</span>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#C94B1A' }}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #D9C9A8', borderRadius: 6, overflow: 'hidden' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#5C5542', fontSize: '1rem' }}>−</button>
                      <span style={{ padding: '0 10px', fontWeight: 700, color: '#1B2E4A', minWidth: 32, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#5C5542', fontSize: '1rem' }}>+</button>
                    </div>
                    <button onClick={() => updateQty(item.id, 0)} style={{ background: 'none', border: 'none', color: '#C94B1A', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, padding: '2rem', position: 'sticky', top: 90 }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '1.5rem' }}>Order Summary</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: '#5C5542' }}>
                <span>Subtotal ({count} items)</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: '#5C5542' }}>
                <span>Shipping</span>
                <span style={{ color: '#3B5A2F', fontWeight: 700 }}>Free</span>
              </div>
              <div style={{ borderTop: '1.5px solid #D9C9A8', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700, color: '#1B2E4A' }}>
                <span>Total</span>
                <span style={{ color: '#C94B1A' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>

              <Link href="/checkout"
                style={{ display: 'block', width: '100%', background: '#C94B1A', color: '#fff', padding: '14px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '1.5rem', textDecoration: 'none', textAlign: 'center' }}>
                Proceed to Checkout →
              </Link>

              <div style={{ marginTop: '1rem', padding: '1rem', background: '#E8F0E4', borderRadius: 8, fontSize: '0.8rem', color: '#3B5A2F', lineHeight: 1.6 }}>
                💳 <strong>Direct payment</strong> goes to the artisan's account. 100% authentic GI product guaranteed.
              </div>

              <Link href="/shop" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#5C5542', textDecoration: 'none' }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width: 768px) {
          div[style*="grid-template-columns: 1fr 360px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
