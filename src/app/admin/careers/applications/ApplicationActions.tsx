'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/careers'

export default function ApplicationActions({ id, status }: { id: string; status: ApplicationStatus }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const call = async (method: 'PATCH' | 'DELETE', body: object) => {
    setBusy(true)
    const res = await fetch('/api/admin/careers/applications', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Something went wrong.')
      return
    }
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        value={status}
        disabled={busy}
        onChange={e => call('PATCH', { id, status: e.target.value })}
        style={{ fontSize: '0.8rem', padding: '4px 6px', borderRadius: 4, border: '1px solid #DDB840', background: '#fff', color: '#1B2E4A' }}
      >
        {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
      </select>
      <button
        disabled={busy}
        onClick={() => { if (confirm('Delete this application and its resume? This cannot be undone.')) call('DELETE', { id }) }}
        style={{ fontSize: '0.78rem', color: '#E8380A', fontWeight: 700, border: '1px solid #E8380A', background: 'none', padding: '4px 10px', borderRadius: 4, cursor: busy ? 'not-allowed' : 'pointer' }}
      >
        Delete
      </button>
    </div>
  )
}
