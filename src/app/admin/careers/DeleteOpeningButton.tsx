'use client'
import { useRouter } from 'next/navigation'

export default function DeleteOpeningButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone. To keep it but take it off the Careers page, use Hide instead.`)) return
    const res = await fetch('/api/admin/careers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Could not delete this position.')
      return
    }
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
