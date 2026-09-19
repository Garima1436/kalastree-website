import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLang, getT } from '@/lib/i18n/server'
import { getStats, PERIODS, type Period } from '@/lib/gaStats'

export const metadata: Metadata = {
  title: 'Stats — KalaStree',
  description: 'Live, anonymous traffic to KalaStree.',
}

const card = { background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '1.25rem 1.5rem' } as const
const heading = { fontFamily: "'EB Garamond', serif", fontSize: '1.25rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 12 } as const

function Breakdown({ title, rows, empty }: { title: string; rows: { name: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map(r => r.value))
  return (
    <section style={card}>
      <h2 style={heading}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ color: '#8A6A3A', fontSize: '0.9rem' }}>{empty}</p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => (
            <li key={r.name} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 10px', fontSize: '0.88rem', color: '#1B2E4A', borderRadius: 6, overflow: 'hidden' }}>
              <span aria-hidden style={{ position: 'absolute', inset: 0, width: `${(r.value / max) * 100}%`, background: '#FFE8A8', zIndex: 0 }} />
              <span style={{ position: 'relative', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <strong style={{ position: 'relative' }}>{r.value.toLocaleString('en-IN')}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: raw } = await searchParams
  const period: Period = (PERIODS as readonly string[]).includes(raw ?? '') ? (raw as Period) : 'today'
  const lang = await getServerLang()
  const t = getT('stats', lang)
  const stats = await getStats(period)
  const periodLabel = { today: t('periodToday'), '7d': t('period7d'), '30d': t('period30d') }

  // Bar chart drawn as plain SVG so it needs no charting library.
  const W = 720
  const H = 180
  const series = stats?.series ?? []
  const maxV = Math.max(1, ...series.map(s => s.value))
  const slot = series.length ? W / series.length : W
  const labelEvery = Math.ceil(series.length / 8)

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      <div style={{ background: '#1B2E4A', padding: '3rem 5%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t('title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{t('subtitle')}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 5% 4rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PERIODS.map(p => (
              <Link
                key={p}
                href={`/stats?period=${p}`}
                style={{
                  padding: '7px 16px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none',
                  border: '1.5px solid #DDB840',
                  background: p === period ? '#1B2E4A' : '#fff',
                  color: p === period ? '#fff' : '#6B4820',
                }}
              >
                {periodLabel[p]}
              </Link>
            ))}
          </div>
          <Link href="/" style={{ color: '#6B4820', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>{t('back')}</Link>
        </div>

        {!stats ? (
          <div style={{ ...card, textAlign: 'center', padding: '3rem 1.5rem', color: '#6B4820' }}>{t('unavailable')}</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                [t('visitors'), stats.totals.visitors],
                [t('pageviews'), stats.totals.pageviews],
                [t('sessions'), stats.totals.sessions],
              ].map(([label, value]) => (
                <div key={label as string} style={card}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A6A3A' }}>{label}</div>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#1B2E4A' }}>{(value as number).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>

            <section style={card}>
              <h2 style={heading}>{period === 'today' ? t('chartTitleToday') : t('chartTitleDaily')}</h2>
              <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" role="img" aria-label={t('visitors')} style={{ display: 'block' }}>
                {series.map((s, i) => {
                  const h = (s.value / maxV) * H
                  return (
                    <g key={s.label}>
                      <rect x={i * slot + slot * 0.15} y={H - h} width={slot * 0.7} height={Math.max(h, s.value ? 2 : 0)} rx={2} fill="#E8380A">
                        <title>{`${s.label}: ${s.value}`}</title>
                      </rect>
                      {i % labelEvery === 0 && (
                        <text x={i * slot + slot / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="#8A6A3A">{s.label}</text>
                      )}
                    </g>
                  )
                })}
                <line x1="0" y1={H} x2={W} y2={H} stroke="#DDB840" />
              </svg>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <Breakdown title={t('topPages')} rows={stats.pages} empty={t('noData')} />
              <Breakdown title={t('sources')} rows={stats.sources} empty={t('noData')} />
              <Breakdown title={t('countries')} rows={stats.countries} empty={t('noData')} />
              <Breakdown title={t('cities')} rows={stats.cities} empty={t('noData')} />
              <Breakdown title={t('devices')} rows={stats.devices} empty={t('noData')} />
            </div>
            <p style={{ color: '#8A6A3A', fontSize: '0.8rem', textAlign: 'center' }}>{t('updated')}</p>
          </>
        )}
      </div>
    </div>
  )
}
