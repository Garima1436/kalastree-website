'use client'
import { useState } from 'react'

export default function DeliveryVerifyPage() {
  const [shortId, setShortId] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    const res = await fetch('/api/delivery/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortId: shortId.trim(), otp: otp.trim() }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.success) { setShortId(''); setOtp('') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1B2E4A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
            Kala<em style={{ color: '#D4A000' }}>Stree</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Delivery Verification Portal
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#1B2E4A', marginBottom: '0.4rem' }}>
            Confirm Delivery
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6B4820', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Ask the customer for their 4-digit OTP and enter it below along with the Order ID shown on the package.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 6 }}>
                Order ID (first 8 characters)
              </label>
              <input
                value={shortId}
                onChange={e => setShortId(e.target.value.toUpperCase())}
                required maxLength={8} placeholder="e.g. A1B2C3D4"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '2px', background: '#FFF8EE', boxSizing: 'border-box', textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 6 }}>
                Customer OTP
              </label>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required maxLength={4} placeholder="_ _ _ _" inputMode="numeric"
                style={{ width: '100%', padding: '16px 14px', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '2rem', fontFamily: 'monospace', letterSpacing: '12px', textAlign: 'center', background: '#FFF8EE', boxSizing: 'border-box' }}
              />
            </div>

            {result && (
              <div style={{
                padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600,
                background: result.success ? '#C8F5D8' : '#FEE2E2',
                color: result.success ? '#1A7A32' : '#B91C1C',
                border: `1px solid ${result.success ? '#86EFAC' : '#FCA5A5'}`,
              }}>
                {result.success ? '✓ Delivery confirmed successfully! Order marked as delivered.' : `✗ ${result.error}`}
              </div>
            )}

            <button type="submit" disabled={loading || otp.length < 4 || shortId.length < 8} style={{
              padding: '13px', background: '#E8380A', color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (loading || otp.length < 4 || shortId.length < 8) ? 0.5 : 1, marginTop: '0.5rem',
            }}>
              {loading ? 'Verifying…' : 'Confirm Delivery →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          Only for authorized delivery partners · KalaStree
        </p>
      </div>
    </div>
  )
}
