'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import dict from '@/lib/i18n/dictionaries/adminOrders'

const STATUSES = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default function UpdateOrderStatus({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { lang } = useLanguage()
  const t = (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
  const statusLabel: Record<string, string> = {
    pending: t('statusPending'),
    confirmed: t('statusConfirmed'),
    paid: t('statusPaid'),
    processing: t('statusProcessing'),
    shipped: t('statusShipped'),
    delivered: t('statusDelivered'),
    cancelled: t('statusCancelled'),
  }

  const update = async (status: string) => {
    setLoading(true)
    const res = await fetch('/api/admin/orders/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, status }),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      window.alert(data?.error ?? 'Could not update order status')
      return
    }

    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B4820', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('statusLabelColon')}
      </span>
      <select value={currentStatus} disabled={loading} onChange={e => update(e.target.value)} style={{
        padding: '6px 12px', border: '1.5px solid #DDB840',
        borderRadius: 6, fontSize: '0.85rem', background: '#FFF8EE', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
      }}>
        {STATUSES.map(s => <option key={s} value={s}>{(statusLabel[s] ?? s).toUpperCase()}</option>)}
      </select>
    </div>
  )
}
