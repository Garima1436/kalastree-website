'use client'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default function UpdateOrderStatus({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter()

  const update = async (status: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', id)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5C5542', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Status:
      </span>
      <select value={currentStatus} onChange={e => update(e.target.value)} style={{
        padding: '6px 12px', border: '1.5px solid #D9C9A8',
        borderRadius: 6, fontSize: '0.85rem', background: '#FDF6E3', cursor: 'pointer',
      }}>
        {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
      </select>
    </div>
  )
}
