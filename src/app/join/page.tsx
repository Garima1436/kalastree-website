'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function JoinPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', state: '', craft: '', gi_product: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const states = ['Andhra Pradesh','Assam','Bihar','Gujarat','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal']

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.craft) return
    setStatus('loading')

    const { error } = await supabase.from('inquiries').insert({
      type: 'artisan_join' as const,
      name: form.name, email: form.email, phone: form.phone || null,
      state: form.state || null, craft: form.craft,
      message: `GI Product: ${form.gi_product || 'N/A'}\n\n${form.message}`,
    } as never)

    if (error) { setStatus('error'); return }

    // Send confirmation + notification emails (non-blocking — form success doesn't depend on email)
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, email: form.email, phone: form.phone,
        craft: form.craft, state: form.state,
        story: `GI Product: ${form.gi_product || 'N/A'}\n\n${form.message}`,
      }),
    }).then(r => { if (!r.ok) console.error('Email send failed:', r.status) })
      .catch(err => console.error('Email send error:', err))

    setStatus('success')
  }

  const inp = { width: '100%', background: 'rgba(253,246,227,0.8)', border: '1.5px solid #D9C9A8', borderRadius: 6, padding: '12px 16px', fontFamily: "'Lato', sans-serif", fontSize: '0.95rem', color: '#1A1A1A', outline: 'none' }

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#3B5A2F', padding: '3.5rem 5%' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#B8860B', textDecoration: 'none' }}>Home</Link> / Sell on KalaStree
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Sell Your Craft. <span style={{ color: '#B8860B' }}>Keep What You Earn.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.8, maxWidth: 600 }}>
            No middlemen. No platform fee for the first year. Direct payments to your account. Your GI product, your price, your income.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div style={{ background: '#E8F0E4', padding: '2.5rem 5%' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '💳', title: 'Direct Payments', body: 'Money hits your UPI/bank account the same day.' },
            { icon: '✅', title: 'GI Verification', body: 'We help you get your product GI-registered if not already.' },
            { icon: '🌍', title: 'Global Reach', body: 'Sell to NRI buyers in UAE, USA, UK and beyond.' },
            { icon: '🤖', title: 'AI Support', body: 'Our chatbot helps buyers find your products.' },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ background: '#FFFEF9', borderRadius: 10, padding: '1.25rem', border: '1.5px solid #D9C9A8', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1rem', fontWeight: 600, color: '#3B5A2F', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: '#5C5542', lineHeight: 1.5 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 5%' }}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#E8F0E4', borderRadius: 12, border: '2px solid #3B5A2F' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#3B5A2F', marginBottom: '1rem' }}>Application Received!</h2>
            <p style={{ color: '#5C5542', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Thank you, {form.name}. Garima's team will review your application and reach out within 48 hours at <strong>{form.email}</strong>.
            </p>
            <Link href="/shop" style={{ background: '#C94B1A', color: '#fff', padding: '12px 24px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
              Browse the Marketplace →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, padding: '2.5rem' }}>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '2rem' }}>Artisan Application Form</h2>

            <div className="join-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>Your Name *</label>
                <input required style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Meena Devi" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>Email *</label>
                <input required type="email" style={inp} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
            </div>

            <div className="join-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>Phone</label>
                <input style={inp} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>State</label>
                <select style={inp} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                  <option value="">Select your state</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>Your Craft *</label>
              <input required style={inp} value={form.craft} onChange={e => setForm({ ...form, craft: e.target.value })} placeholder="e.g. Madhubani Painting, Pashmina Weaving, Phulkari Embroidery..." />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>GI Product (if any)</label>
              <input style={inp} value={form.gi_product} onChange={e => setForm({ ...form, gi_product: e.target.value })} placeholder="e.g. Madhubani Art (Bihar GI Tag 2007)" />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 8 }}>Tell us about your work</label>
              <textarea rows={4} style={{ ...inp, resize: 'vertical' }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your craft, how long you've been doing it, and what you'd like to sell on KalaStree..." />
            </div>

            <button type="submit" disabled={status === 'loading'} style={{ width: '100%', background: status === 'loading' ? '#aaa' : '#3B5A2F', color: '#fff', padding: '14px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
              {status === 'loading' ? 'Submitting...' : 'Submit My Application →'}
            </button>
            {status === 'error' && <p style={{ color: '#C94B1A', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>Something went wrong. Please email garima@kalastree.com directly.</p>}
          </form>
        )}
        <style>{`
          @media(max-width:600px){
            .join-form-grid { grid-template-columns:1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
