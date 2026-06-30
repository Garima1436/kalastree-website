'use client'
import Link from 'next/link'
import { CATEGORY_META, type Category } from '@/lib/types'

export default function CategoryGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
      {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
        <Link key={key} href={`/shop?category=${key}`} style={{ textDecoration: 'none' }}>
          <div
            className="cat-card"
            style={{ background: meta.bg, border: `2px solid ${meta.color}20`, borderRadius: 12, padding: '2rem', textAlign: 'center', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{meta.icon}</div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
            <div style={{ fontSize: '0.78rem', color: '#6B4820' }}>Shop collection →</div>
          </div>
        </Link>
      ))}
      <style>{`
        .cat-card { transition: transform 0.25s, box-shadow 0.25s; }
        .cat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  )
}
