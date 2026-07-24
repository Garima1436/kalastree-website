'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000

function timeRemainingLabel(msLeft: number): string {
  if (msLeft <= 0) return ''
  const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000))
  return hoursLeft <= 1 ? 'less than 1 hour left to cancel' : `${hoursLeft} hours left to cancel`
}

export default function CancelOrder({ orderId, createdAt }: { orderId: string; createdAt: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // Reading the clock is inherently impure — done once via a lazy initial-state
  // initializer (React's documented escape hatch for this) rather than during
  // the render body itself, since createdAt is static for a given order anyway.
  const [msLeft] = useState(() => new Date(createdAt).getTime() + CANCEL_WINDOW_MS - Date.now())
  const router = useRouter()

  if (msLeft <= 0) return null

  const cancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/orders/cancel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Could not cancel this order.'); return }
    setDone(true)
    router.refresh()
  }

  if (done) return <span style={{ fontSize: '0.82rem', color: '#B91C1C', fontWeight: 700 }}>Order cancelled</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginTop: '0.75rem' }}>
      <button onClick={cancel} disabled={loading} style={{
        padding: '8px 20px', background: 'transparent', color: '#B91C1C',
        border: '1.5px solid #B91C1C', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
      }}>
        {loading ? 'Cancelling…' : 'Cancel Order'}
      </button>
      <span style={{ fontSize: '0.72rem', color: '#A07840' }}>{timeRemainingLabel(msLeft)}</span>
      {error && <span style={{ fontSize: '0.78rem', color: '#B91C1C' }}>{error}</span>}
    </div>
  )
}
