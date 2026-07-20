'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import dict from '@/lib/i18n/dictionaries/adminRemittance'

const todayIso = () => new Date().toISOString().slice(0, 10)
const daysAgoIso = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function SyncRemittanceButton() {
  const router = useRouter()
  const { lang } = useLanguage()
  const t = (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]

  const [from, setFrom] = useState(daysAgoIso(30))
  const [to, setTo] = useState(todayIso())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ matched: number; alreadyReconciled: number; unmatched: number } | null>(null)
  const [error, setError] = useState('')

  const sync = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    const res = await fetch('/api/admin/remittance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Unknown error'); return }
    setResult(data)
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '0.85rem', background: '#FFF8EE',
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6B4820', marginBottom: 4 }}>{t('fromLabel')}</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6B4820', marginBottom: 4 }}>{t('toLabel')}</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={sync} disabled={loading} style={{
          padding: '9px 20px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: '0.85rem', background: '#1A7A32', color: '#fff', opacity: loading ? 0.6 : 1,
        }}>
          {loading ? t('syncingBtn') : `🔄 ${t('syncNowBtn')}`}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '1rem', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '8px 12px', color: '#B91C1C', fontSize: '0.82rem' }}>
          {t('syncFailedPrefix')}{error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#1B2E4A', flexWrap: 'wrap' }}>
          <span>✅ {t('resultMatched')}: <strong>{result.matched}</strong></span>
          <span>☑️ {t('resultAlready')}: <strong>{result.alreadyReconciled}</strong></span>
          <span>❓ {t('resultUnmatched')}: <strong>{result.unmatched}</strong></span>
        </div>
      )}
    </div>
  )
}
