'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import artisanDashboard from '@/lib/i18n/dictionaries/artisanDashboard'
import common from '@/lib/i18n/dictionaries/common'

export default function ArtisanOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const [shipError, setShipError] = useState('')
  const router = useRouter()
  const { lang } = useLanguage()
  const t = (k: keyof typeof artisanDashboard.en) => artisanDashboard[lang][k] ?? artisanDashboard.en[k]
  const tc = (k: keyof typeof common.en) => common[lang][k] ?? common.en[k]

  const update = async (newStatus: string) => {
    setLoading(true)
    setShipError('')
    const res = await fetch('/api/artisan/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setShipError(data?.error || 'Something went wrong')
      return
    }
    router.refresh()
  }

  if (status === 'paid') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => update('processing')} disabled={loading} style={{
        padding: '7px 16px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '0.82rem', background: '#1A7A32', color: '#fff', opacity: loading ? 0.6 : 1,
      }}>
        ✓ {t('acceptOrder')}
      </button>
      <button onClick={() => { if (confirm(t('confirmRejectOrder'))) update('cancelled') }} disabled={loading} style={{
        padding: '7px 16px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '0.82rem', background: '#FEE2E2', color: '#B91C1C', opacity: loading ? 0.6 : 1,
      }}>
        ✗ {t('rejectAction')}
      </button>
    </div>
  )

  if (status === 'processing') {
    return (
      <div>
        <button onClick={() => update('shipped')} disabled={loading} style={{
          padding: '7px 18px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: '0.82rem', background: '#1d4ed8', color: '#fff', opacity: loading ? 0.6 : 1,
        }}>
          {loading ? t('saving') : `🚚 ${t('markAsShipped')}`}
        </button>
        {shipError && (
          <div style={{ marginTop: 8, maxWidth: 320, background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '8px 12px', color: '#B91C1C', fontSize: '0.78rem' }}>
            {shipError}
          </div>
        )}
      </div>
    )
  }

  return null
}
