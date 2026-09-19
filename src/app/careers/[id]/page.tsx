import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerLang, getT } from '@/lib/i18n/server'
import CareersApplyForm from '@/components/CareersApplyForm'
import JobDescription from '@/components/JobDescription'
import { getLiveOpening } from '@/lib/careersData'
import { employmentTypeLabels, jobRef, relativePosted, roleWithRef } from '@/lib/careers'
import { parseOpeningId } from '@/lib/careersValidation'

type Params = { params: Promise<{ id: string }> }

// The address ends in the role's id (/careers/marketing-intern-<uuid>). A hidden,
// deleted or malformed address gives the normal 404 — nothing is revealed about
// whether a hidden role exists.
async function loadRole(params: Params['params']) {
  const { id: segment } = await params
  const id = parseOpeningId(segment)
  return id ? getLiveOpening(id) : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const role = await loadRole(params)
  if (!role) return { title: 'Careers — KalaStree' }
  return {
    title: `${role.title} — Careers — KalaStree`,
    description: `${role.title} at KalaStree · ${role.location}`,
  }
}

const chipStyle = { background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 } as const

export default async function CareerDetailPage({ params }: Params) {
  const role = await loadRole(params)
  if (!role) notFound()

  const lang = await getServerLang()
  const t = getT('careers', lang)
  const tc = getT('common', lang)
  const typeLabels = employmentTypeLabels(t)

  const title = lang === 'hi' && role.title_hi ? role.title_hi : role.title
  const description = lang === 'hi' && role.description_hi ? role.description_hi : role.description

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>{tc('home')}</Link> /{' '}
            <Link href="/careers" style={{ color: '#D4A000', textDecoration: 'none' }}>{t('breadcrumb')}</Link>
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            {title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <span style={chipStyle}>📍 {role.location}</span>
            <span style={chipStyle}>🕒 {typeLabels[role.employment_type] ?? role.employment_type}</span>
            <span style={chipStyle}>{t('jobIdLabel')}: {jobRef(role.id)}</span>
            <span style={chipStyle}>{t('posted')} {relativePosted(role.created_at, lang)}</span>
          </div>
          <a href="#apply" style={{ display: 'inline-block', background: '#E8380A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
            {t('applyNow')}
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 5% 4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <Link href="/careers" style={{ color: '#6B4820', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          {t('allPositions')}
        </Link>

        <section style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', color: '#6B4820', lineHeight: 1.75, fontSize: '0.97rem' }}>
          <JobDescription text={description} />
        </section>

        {/* Tied to this opening by id; the team email shows the English title so it reads consistently. */}
        <CareersApplyForm job={{ id: role.id, title: roleWithRef(role) }} />
      </div>
    </div>
  )
}
