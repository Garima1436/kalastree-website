'use client'
import { useRouter } from 'next/navigation'

export default function DeleteGIProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch('/api/admin/gi-products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <button onClick={handleDelete} style={{
      fontSize: '0.78rem', color: '#EF4444', fontWeight: 700,
      border: '1px solid #EF4444', background: 'none',
      padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
    }}>
      Delete
    </button>
  )
}
