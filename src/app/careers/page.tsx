import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLang, getT } from '@/lib/i18n/server'
import CareersApplyForm from '@/components/CareersApplyForm'
import { getLiveOpenings } from '@/lib/careersData'
import { employmentTypeLabels, openingPath, relativePosted } from '@/lib/careers'

export const metadata: Metadata = {
  title: 'Careers — KalaStree',
  description: 'Join KalaStree and help bring India\'s GI-verified crafts, and the women who make them, to the world.',
}

export default async function CareersPage() {
  const lang = await getServerLang()
  const t = getT('careers', lang)
  const tc = getT('common', lang)
  // Roles are managed by admins at /admin/careers; each links to its own page.
  const openings = await getLiveOpenings()
  const typeLabels = employmentTypeLabels(t)
  // The three mission pillars are the About page's own published copy, reused
  // here so the two pages can't drift apart.
  const ta = getT('about', lang)
  const pillars = [
    { title: ta('pillar1Title'), body: ta('pillar1Body') },
    { title: ta('pillar2Title'), body: ta('pillar2Body') },
    { title: ta('pillar3Title'), body: ta('pillar3Body') },
  ]
  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
  ]

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>{tc('home')}</Link> / {t('breadcrumb')}
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            {t('heroTitle')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 600, lineHeight: 1.6 }}>
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 5%', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {/* Why work with us */}
        <section>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '0.5rem' }}>
            {t('whyHeading')}
          </h2>
          <p style={{ color: '#6B4820', lineHeight: 1.7, marginBottom: '1.25rem' }}>{t('whyIntro')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {pillars.map(({ title, body }, i) => (
              <div key={title} style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', color: '#D4A000', marginBottom: 8 }}>0{i + 1}</div>
                <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.25rem', fontWeight: 600, color: '#1A7A32', marginBottom: 6 }}>{title}</h3>
                <p style={{ color: '#6B4820', lineHeight: 1.7, fontSize: '0.9rem' }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open positions */}
        <section>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '1.25rem' }}>
            {t('openPositionsHeading')}
          </h2>

          {openings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💼</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '0.75rem' }}>
                {t('noPositionsTitle')}
              </p>
              <p style={{ color: '#6B4820', lineHeight: 1.8, maxWidth: 560, margin: '0 auto' }}>
                {t('noPositionsBody')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {openings.map(role => (
                <Link key={role.id} href={openingPath(role)} className="opening-card" style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.35rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 4 }}>
                      {lang === 'hi' && role.title_hi ? role.title_hi : role.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 4 }}>
                      {role.location} · {typeLabels[role.employment_type] ?? role.employment_type}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: '#8A6A3A' }}>
                      {t('posted')} {relativePosted(role.created_at, lang)}
                    </p>
                  </div>
                  <span style={{ color: '#E8380A', fontWeight: 700, fontSize: '0.9rem' }}>{t('viewDetails')} →</span>
                </Link>
              ))}
              <style>{`.opening-card { transition: border-color 0.15s, box-shadow 0.15s; } .opening-card:hover { border-color: #E8380A !important; box-shadow: 0 4px 16px rgba(26,10,0,0.08); }`}</style>
            </div>
          )}
        </section>

        {/* How we hire */}
        <section>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '1.25rem' }}>
            {t('processHeading')}
          </h2>
          <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {steps.map(({ title, body }, i) => (
              <li key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#1B2E4A', color: '#D4A000', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#1B2E4A', marginBottom: 2 }}>{title}</div>
                  <div style={{ color: '#6B4820', fontSize: '0.9rem', lineHeight: 1.6 }}>{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <CareersApplyForm />
      </div>
    </div>
  )
}
