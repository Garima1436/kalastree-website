'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { INDIAN_STATES } from '@/lib/indian-states'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface CartItem { id: string; name: string; price: number; image: string; slug: string; qty: number }

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const { t } = useTranslation('shopping')
  const { t: tc } = useTranslation('common')
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
    if (!loaded) { alert(t('gatewayLoadFailed')); setLoadingMethod(null); return }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: total * 100,
      currency: 'INR',
      name: 'KalaStree',
      description: 'GI-verified artisan products',
      image: '/gi-logo.png',
      order_id: razorpayOrderId,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: '#E8380A' },
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
          alert(t('paymentVerificationFailed'))
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
    width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840',
    borderRadius: 6, fontSize: '0.9rem', background: '#FFF8EE', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 5,
  }

  if (cart.length === 0) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#6B4820', background: 'var(--parchment)' }}>
      <div style={{ fontSize: '3rem' }}>🛒</div>
      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>{t('cartEmptyMessage')}</p>
      <Link href="/shop" style={{ color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>{t('browseProducts')} →</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)', padding: '3rem 5%' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '2rem' }}>
          {t('checkoutTitle')}
        </h1>

        <form onSubmit={handleCheckout}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

            {/* Shipping form */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1B2E4A' }}>
                {t('shippingDetails')}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>{t('fullName')} *</label>
                  <input style={inputStyle} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
                </div>
                <div>
                  <label style={labelStyle}>{t('phoneLabel')} *</label>
                  <input style={inputStyle} required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('emailLabel')} *</label>
                <input style={inputStyle} required type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>{t('addressLabel')} *</label>
                <input style={inputStyle} required value={form.address} onChange={e => set('address', e.target.value)} placeholder={t('addressPlaceholder')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>{t('cityLabel')} *</label>
                  <input style={inputStyle} required value={form.city} onChange={e => set('city', e.target.value)} placeholder="Delhi" />
                </div>
                <div>
                  <label style={labelStyle}>{t('stateLabel')} *</label>
                  <select style={inputStyle} required value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">{t('selectStatePlaceholder')}</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t('pincodeLabel')} *</label>
                  <input style={inputStyle} required value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="110001" pattern="[0-9]{6}" />
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '1.75rem', position: 'sticky', top: 90 }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '1.25rem' }}>
                {t('orderSummary')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: '#6B4820' }}>{item.name} ×{item.qty}</span>
                    <span style={{ fontWeight: 700, color: '#1B2E4A' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1.5px solid #DDB840', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700 }}>
                <span>{tc('total')}</span>
                <span style={{ color: '#E8380A' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#C8F5D8', borderRadius: 6, fontSize: '0.75rem', color: '#1A7A32', lineHeight: 1.6 }}>
                🚚 {t('freeShipping')} &nbsp;·&nbsp; 🔒 {t('securedPayment')} &nbsp;·&nbsp; ✅ {t('giVerified')}
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
                {loadingMethod === 'razorpay' ? t('openingRazorpay') : (
                  <><span>🇮🇳</span><span>{t('payWithRazorpay')}</span><span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{t('razorpayMethods')}</span></>
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
                {loadingMethod === 'stripe' ? t('redirectingToStripe') : (
                  <><span>🌍</span><span>{t('payWithCard')}</span><span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{t('stripeMethods')}</span></>
                )}
              </button>
              <Link href="/cart" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', fontSize: '0.82rem', color: '#6B4820', textDecoration: 'none' }}>
                ← {t('editCart')}
              </Link>
            </div>
          </div>
        </form>
      </div>
      <style>{`@media(max-width:768px){form>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
