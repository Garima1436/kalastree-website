'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

// "● 31 online · 3,263 visitors today · stats →" pill; the link opens the public /stats
// page. Renders nothing until real numbers arrive, and stays hidden if live stats aren't
// configured.
export default function LiveVisitors() {
  const { t, lang } = useTranslation('common')
  const [stats, setStats] = useState<{ online: number; today: number } | null>(null)

  useEffect(() => {
    let stopped = false
    const load = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch('/api/live-stats')
        const data = await res.json()
        if (!stopped && data.enabled) setStats({ online: data.online, today: data.today })
      } catch {
        // Keep whatever is showing.
      }
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => { stopped = true; clearInterval(timer) }
  }, [])

  if (!stats) return null
  const fmt = (n: number) => n.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')
  // The visitor is looking at the site right now, so there is always at least one.
  const online = Math.max(stats.online, 1)

  return (
    <Link
      href="/stats"
      style={{
        textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 20, padding: '0 9px',
        border: '1px solid #EDD060', borderRadius: 999, background: '#fff',
        fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: '#6B4820', whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A7A32', display: 'inline-block' }} />
      <strong style={{ color: '#1A7A32' }}>{fmt(online)} {t('liveOnline')}</strong>
      <span className="live-today"> · {fmt(stats.today)} {t('liveToday')}</span>
      <span aria-hidden className="live-stats-link" style={{ color: '#E8380A', fontWeight: 700 }}> · {t('liveStats')} →</span>
      <style>{`@media(max-width:480px){ .live-today, .live-stats-link { display:none } }`}</style>
    </Link>
  )
}
