'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveRejectButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const update = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected') {
      const note = prompt('Reason for rejection (optional):')
      if (note === null) return // cancelled
      setLoading(true)
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, rejection_note: note }),
      })
    } else {
      setLoading(true)
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => update('approved')} disabled={loading} style={{
        fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 4,
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        background: '#1A7A32', color: '#fff', opacity: loading ? 0.6 : 1,
      }}>✓ Approve</button>
      <button onClick={() => update('rejected')} disabled={loading} style={{
        fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 4,
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        background: '#FEE2E2', color: '#B91C1C', opacity: loading ? 0.6 : 1,
      }}>✗ Reject</button>
    </>
  )
}
