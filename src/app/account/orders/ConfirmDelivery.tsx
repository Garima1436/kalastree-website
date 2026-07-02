'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmDelivery({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const confirm = async () => {
    if (!window.confirm('Confirm that you have received this order?')) return
    setLoading(true)
    await fetch('/api/orders/confirm-delivery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    setLoading(false)
    setDone(true)
    router.refresh()
  }

  if (done) return <span style={{ fontSize: '0.82rem', color: '#1A7A32', fontWeight: 700 }}>✓ Delivery confirmed!</span>

  return (
    <button onClick={confirm} disabled={loading} style={{
      marginTop: '0.75rem', padding: '8px 20px', background: '#1A7A32', color: '#fff',
      border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem',
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
    }}>
      {loading ? 'Confirming…' : '✓ I received this order'}
    </button>
  )
}
