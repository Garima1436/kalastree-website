'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArtisanOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const [showShipForm, setShowShipForm] = useState(false)
  const [awb, setAwb] = useState('')
  const router = useRouter()

  const update = async (newStatus: string, extra?: Record<string, string>) => {
    setLoading(true)
    await fetch('/api/artisan/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus, ...extra }),
    })
    setLoading(false)
    router.refresh()
  }

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!awb.trim()) return
    await update('shipped', {
      tracking_number: awb.trim(),
      tracking_url: `https://ithinklogistics.com/track/?awb=${awb.trim()}`,
    })
    setShowShipForm(false)
  }

  if (status === 'paid') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => update('processing')} disabled={loading} style={{
        padding: '7px 16px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '0.82rem', background: '#1A7A32', color: '#fff', opacity: loading ? 0.6 : 1,
      }}>
        ✓ Accept Order
      </button>
      <button onClick={() => { if (confirm('Reject this order?')) update('cancelled') }} disabled={loading} style={{
        padding: '7px 16px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '0.82rem', background: '#FEE2E2', color: '#B91C1C', opacity: loading ? 0.6 : 1,
      }}>
        ✗ Reject
      </button>
    </div>
  )

  if (status === 'processing') {
    if (showShipForm) return (
      <form onSubmit={handleShip} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={awb} onChange={e => setAwb(e.target.value)}
          placeholder="iThink AWB number" required
          style={{ padding: '7px 12px', border: '1.5px solid #86EFAC', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'monospace', width: 200 }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '7px 16px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: '0.82rem', background: '#1d4ed8', color: '#fff', opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Saving…' : '🚚 Confirm Ship'}
        </button>
        <button type="button" onClick={() => setShowShipForm(false)} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#6B4820', cursor: 'pointer' }}>
          Cancel
        </button>
      </form>
    )

    return (
      <button onClick={() => setShowShipForm(true)} style={{
        padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
        fontWeight: 700, fontSize: '0.82rem', background: '#1d4ed8', color: '#fff',
      }}>
        🚚 Mark as Shipped
      </button>
    )
  }

  return null
}
