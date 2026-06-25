'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`Change this user to "${newRole}"?`)) return
    setLoading(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setLoading(false)
    router.refresh()
  }

  const isAdmin = currentRole === 'admin'
  return (
    <button onClick={toggle} disabled={loading} style={{
      fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
      background: isAdmin ? '#FEE2E2' : '#E8F0E4',
      color: isAdmin ? '#B91C1C' : '#3B5A2F',
      opacity: loading ? 0.6 : 1,
    }}>
      {loading ? '…' : isAdmin ? 'Remove Admin' : 'Make Admin'}
    </button>
  )
}
