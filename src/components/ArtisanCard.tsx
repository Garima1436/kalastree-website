'use client'
import Link from 'next/link'
import type { Artisan } from '@/lib/types'

export default function ArtisanCard({ artisan }: { artisan: Artisan }) {
  return (
    <Link href={`/artisans/${artisan.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12,
        padding: '1.5rem', textAlign: 'center',
        transition: 'transform 0.25s, box-shadow 0.25s',
        cursor: 'pointer',
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
        <div style={{ width: 90, height: 90, borderRadius: '50% 40% 55% 45% / 45% 55% 40% 50%', border: '2.5px solid #D4A000', margin: '0 auto 1rem', overflow: 'hidden', background: '#FFE8A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {artisan.photo_url
            ? <img src={artisan.photo_url} alt={artisan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.5rem' }}>👩‍🎨</span>
          }
        </div>

        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 4 }}>
          {artisan.name}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#6B4820', marginBottom: 8 }}>
          {artisan.craft} · {artisan.state}
        </div>
        {artisan.is_verified && (
          <span className="verified-badge">✓ GI Verified</span>
        )}
        {artisan.gi_product && (
          <div style={{ fontSize: '0.75rem', color: '#D4A000', marginTop: 8, fontStyle: 'italic' }}>
            {artisan.gi_product}
          </div>
        )}
      </div>
    </Link>
  )
}
