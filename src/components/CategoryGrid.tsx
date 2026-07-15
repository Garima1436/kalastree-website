'use client'
import Link from 'next/link'
import { CATEGORY_META, type Category } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function CategoryGrid({ categoryImages }: { categoryImages?: Partial<Record<Category, string>> }) {
  const { t } = useTranslation('home')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
      {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => {
        const image = categoryImages?.[key]
        return (
          <Link key={key} href={`/shop?category=${key}`} style={{ textDecoration: 'none' }}>
            <div
              className="cat-card"
              style={{ position: 'relative', height: 220, borderRadius: 12, border: `2px solid ${meta.color}20`, overflow: 'hidden', cursor: 'pointer' }}
            >
              {image ? (
                <>
                  <img src={image} alt={meta.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.68) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>{meta.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>{t('shopCollection')} →</div>
                  </div>
                </>
              ) : (
                <div style={{ height: '100%', background: meta.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{meta.icon}</div>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B4820' }}>{t('shopCollection')} →</div>
                </div>
              )}
            </div>
          </Link>
        )
      })}
      <style>{`
        .cat-card { transition: transform 0.25s, box-shadow 0.25s; }
        .cat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  )
}
