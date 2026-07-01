'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArtisanOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const update = async (newStatus: string) => {
    setLoading(true)
    await fetch('/api/artisan/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus }),
    })
    setLoading(false)
    router.refresh()
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

  if (status === 'processing') return (
    <button onClick={() => update('shipped')} disabled={loading} style={{
      padding: '7px 18px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
      fontWeight: 700, fontSize: '0.82rem', background: '#1d4ed8', color: '#fff', opacity: loading ? 0.6 : 1,
    }}>
      🚚 Mark as Shipped
    </button>
  )

  return null
}
