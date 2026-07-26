'use client'
import Link from 'next/link'
import type { Artisan } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function ArtisanCard({ artisan }: { artisan: Artisan }) {
  const { t } = useTranslation('artisansPage')
  return (
    <Link href={`/artisans/${artisan.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12,
        padding: '1.5rem', textAlign: 'center',
        transition: 'transform 0.25s, box-shadow 0.25s',
        cursor: 'pointer',
        height: 330, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 12px 32px rgba(26,10,0,0.1)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Photo */}
        <div style={{ width: 90, height: 90, flexShrink: 0, borderRadius: '50% 40% 55% 45% / 45% 55% 40% 50%', border: '2.5px solid #D4A000', margin: '0 auto 1rem', overflow: 'hidden', background: '#FFE8A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {artisan.photo_url
            ? <img src={artisan.photo_url} alt={artisan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.5rem' }}>👩‍🎨</span>
          }
        </div>

        <div style={{
          fontFamily: "'EB Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          lineHeight: 1.25, minHeight: '2.5em',
        }}>
          {artisan.name}
        </div>
        <div style={{
          fontSize: '0.78rem', color: '#6B4820', marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          lineHeight: 1.3, minHeight: '2rem',
        }}>
          {artisan.craft} · {artisan.state}
        </div>

        {/* Spacer pushes badge/product to the bottom so every card ends at the same point */}
        <div style={{ flexGrow: 1 }} />

        <div style={{ minHeight: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {artisan.is_verified && (
            <span className="verified-badge">✓ {t('giVerifiedBadge')}</span>
          )}
        </div>
        <div style={{
          fontSize: '0.75rem', color: '#D4A000', marginTop: 8, fontStyle: 'italic', minHeight: '1.2rem',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {artisan.gi_product ?? ''}
        </div>
      </div>
    </Link>
  )
}
