'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OpeningVisibilityToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/careers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !isActive }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Could not update this position.')
      return
    }
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} style={{
      fontSize: '0.78rem', color: '#1A7A32', fontWeight: 700,
      border: '1px solid #1A7A32', background: 'none',
      padding: '4px 10px', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
    }}>
      {isActive ? 'Hide' : 'Show'}
    </button>
  )
}
