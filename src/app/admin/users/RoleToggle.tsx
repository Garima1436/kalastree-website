'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = ['user', 'artisan', 'admin'] as const
type Role = typeof ROLES[number]

const roleStyle: Record<Role, { bg: string; color: string; label: string }> = {
  user:    { bg: '#FFE8A8', color: '#6B4820', label: '👤 User' },
  artisan: { bg: '#C8F5D8', color: '#1A7A32', label: '🎨 Artisan' },
  admin:   { bg: '#FFF0C0', color: '#D4A000', label: '⚙️ Admin' },
}

export default function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const role = (currentRole as Role) ?? 'user'
  const s = roleStyle[role] ?? roleStyle.user

  const setRole = async (newRole: Role) => {
    if (newRole === role) { setOpen(false); return }
    if (!confirm(`Change this user to "${newRole}"?`)) { setOpen(false); return }
    setLoading(true); setOpen(false)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); alert('Failed: ' + (d.error || 'Unknown')); return }
    router.refresh()
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} disabled={loading} style={{
        fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
        border: `1px solid ${s.color}40`, cursor: loading ? 'not-allowed' : 'pointer',
        background: s.bg, color: s.color, opacity: loading ? 0.6 : 1,
      }}>
        {loading ? '…' : s.label + ' ▾'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1.5px solid #DDB840', borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 120, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {ROLES.map(r => {
            const rs = roleStyle[r]
            return (
              <button key={r} onClick={() => setRole(r)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
                background: r === role ? rs.bg : '#fff', color: rs.color,
                border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              }}>
                {rs.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
