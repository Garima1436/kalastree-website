'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CartItem { id: string; name: string; price: number; image: string; slug: string; qty: number }

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
  })
  const router = useRouter()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('kalastree_cart') || '[]')
    setCart(stored)

    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      set('email', session.user.email ?? '')
      const res = await fetch('/api/profile')
      const { profile } = await res.json()
      if (profile) {
        setForm(f => ({
          ...f,
          name: profile.full_name ?? f.name,
          phone: profile.phone ?? f.phone,
          address: profile.address_line ?? f.address,
          city: profile.city ?? f.city,
          state: profile.state ?? f.state,
          pincode: profile.pincode ?? f.pincode,
        }))
      }
    })
  }, [])

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const loadRazorpay = () => new Promise<boolean>(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const [loadingMethod, setLoadingMethod] = useState<'razorpay' | 'stripe' | null>(null)

  const handleRazorpay = async () => {
    if (cart.length === 0) return
    setLoadingMethod('razorpay')

    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, items: cart, ...form }),
    })
    const { razorpayOrderId, orderId, error: createError } = await res.json()
    if (createError) { alert(createError); setLoadingMethod(null); return }

    const loaded = await loadRazorpay()
    if (!loaded) { alert('Payment gateway failed to load. Please try again.'); setLoadingMethod(null); return }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: total * 100,
      currency: 'INR',
      name: 'KalaStree',
      description: 'GI-verified artisan products',
      image: '/gi-logo.png',
      order_id: razorpayOrderId,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: '#C94B1A' },
      handler: async (response: any) => {
        const verifyRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          }),
        })
        const { success } = await verifyRes.json()
        if (success) {
          localStorage.removeItem('kalastree_cart')
          window.dispatchEvent(new Event('cart_updated'))
          router.push(`/order/${orderId}`)
        } else {
          alert('Payment verification failed. Please contact support.')
          setLoadingMethod(null)
        }
      },
      modal: { ondismiss: () => setLoadingMethod(null) },
    })
    rzp.open()
  }

  const handleStripe = async () => {
    if (cart.length === 0) return
    setLoadingMethod('stripe')
    const res = await fetch('/api/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, ...form }),
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setLoadingMethod(null); return }
    localStorage.removeItem('kalastree_cart')
    window.dispatchEvent(new Event('cart_updated'))
    window.location.href = url
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #D9C9A8',
    borderRadius: 6, fontSize: '0.9rem', background: '#FDF6E3', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 5,
  }

  if (cart.length === 0) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#5C5542', background: 'var(--parchment)' }}>
      <div style={{ fontSize: '3rem' }}>🛒</div>
      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>Your cart is empty.</p>
      <Link href="/shop" style={{ color: '#C94B1A', fontWeight: 700, textDecoration: 'none' }}>Browse products →</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)', padding: '3rem 5%' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '2rem' }}>
          Checkout
        </h1>

        <form onSubmit={handleCheckout}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

            {/* Shipping form */}
            <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1B2E4A' }}>
                Shipping Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input style={inputStyle} required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} required type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Address *</label>
                <input style={inputStyle} required value={form.address} onChange={e => set('address', e.target.value)} placeholder="House no., Street, Area" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input style={inputStyle} required value={form.city} onChange={e => set('city', e.target.value)} placeholder="Delhi" />
                </div>
                <div>
                  <label style={labelStyle}>State *</label>
                  <input style={inputStyle} required value={form.state} onChange={e => set('state', e.target.value)} placeholder="Delhi" />
                </div>
                <div>
                  <label style={labelStyle}>Pincode *</label>
                  <input style={inputStyle} required value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="110001" pattern="[0-9]{6}" />
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, padding: '1.75rem', position: 'sticky', top: 90 }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '1.25rem' }}>
                Order Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: '#5C5542' }}>{item.name} ×{item.qty}</span>
                    <span style={{ fontWeight: 700, color: '#1B2E4A' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1.5px solid #D9C9A8', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: '#C94B1A' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#E8F0E4', borderRadius: 6, fontSize: '0.75rem', color: '#3B5A2F', lineHeight: 1.6 }}>
                🚚 Free shipping &nbsp;·&nbsp; 🔒 Secured payment &nbsp;·&nbsp; ✅ GI Verified
              </div>

              {/* Razorpay — India */}
              <button
                type="button"
                onClick={handleRazorpay}
                disabled={!!loadingMethod}
                style={{
                  width: '100%', background: '#072654', color: '#fff', padding: '13px',
                  border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
                  cursor: loadingMethod ? 'not-allowed' : 'pointer',
                  opacity: loadingMethod && loadingMethod !== 'razorpay' ? 0.5 : 1,
                  marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loadingMethod === 'razorpay' ? 'Opening Razorpay…' : (
                  <><span>🇮🇳</span><span>Pay with Razorpay</span><span style={{ fontSize: '0.75rem', opacity: 0.75 }}>UPI · Cards · NetBanking</span></>
                )}
              </button>

              {/* Stripe — International */}
              <button
                type="button"
                onClick={handleStripe}
                disabled={!!loadingMethod}
                style={{
                  width: '100%', background: '#635BFF', color: '#fff', padding: '13px',
                  border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
                  cursor: loadingMethod ? 'not-allowed' : 'pointer',
                  opacity: loadingMethod && loadingMethod !== 'stripe' ? 0.5 : 1,
                  marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loadingMethod === 'stripe' ? 'Redirecting to Stripe…' : (
                  <><span>🌍</span><span>Pay with Card</span><span style={{ fontSize: '0.75rem', opacity: 0.75 }}>International · Visa · Mastercard</span></>
                )}
              </button>
              <Link href="/cart" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', fontSize: '0.82rem', color: '#5C5542', textDecoration: 'none' }}>
                ← Edit cart
              </Link>
            </div>
          </div>
        </form>
      </div>
      <style>{`@media(max-width:768px){form>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
