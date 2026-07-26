'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Artisan, Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function ArtisanProfilePage() {
  const { t } = useTranslation('artisanDetail')
  const { t: tc } = useTranslation('common')
  const { slug } = useParams<{ slug: string }>()
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from('artisans').select('*').eq('slug', slug).single()
      const artisanData = a as unknown as Artisan | null
      if (artisanData) {
        setArtisan(artisanData)
        const { data: p } = await supabase.from('products').select('*, artisan:artisans(*)').eq('artisan_id', artisanData.id)
        setProducts((p ?? []) as unknown as Product[])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B7480' }}>{tc('loading')}</div>
  if (!artisan) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}><p>{t('notFound')}</p><Link href="/artisans" style={{ color: '#1E5F74' }}>{t('backToAll')}</Link></div>

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#E3ECEE', padding: '0.75rem 5%', fontSize: '0.78rem', color: '#5B7480' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/" style={{ color: '#5B7480', textDecoration: 'none' }}>{tc('home')}</Link> {' / '}
          <Link href="/artisans" style={{ color: '#5B7480', textDecoration: 'none' }}>{tc('artisans')}</Link> {' / '}
          <span style={{ color: '#16303A', fontWeight: 600 }}>{artisan.name}</span>
        </div>
      </div>

      {/* Profile Hero */}
      <div style={{ background: '#16303A', padding: '3rem 5%' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 140, height: 140, borderRadius: '50% 40% 55% 45% / 45% 55% 40% 50%', border: '3px solid #1E5F74', overflow: 'hidden', background: '#E3ECEE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {artisan.photo_url
              ? <img src={artisan.photo_url} alt={artisan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '4rem' }}>👩‍🎨</span>
            }
          </div>
          <div>
            <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{artisan.name}</h1>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: '0.85rem', color: '#1E5F74' }}>🏺 {artisan.craft}</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>📍 {artisan.state}</span>
              {artisan.gi_product && <span style={{ fontSize: '0.85rem', color: '#1E5F74', fontStyle: 'italic' }}>✦ {artisan.gi_product}</span>}
            </div>
            {artisan.is_verified && <span className="verified-badge">✓ {t('giVerifiedArtisanBadge')}</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 5%', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', alignItems: 'start' }}>
        {/* Story sidebar */}
        <div style={{ background: '#F5F7F6', border: '1.5px solid #C7D2D6', borderRadius: 12, padding: '2rem', position: 'sticky', top: 90 }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#16303A', marginBottom: '1rem' }}>{t('herStory')}</h2>
          {artisan.story
            ? <div className="rich-text" style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#5B7480', fontStyle: 'italic' }}>
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{artisan.story}</ReactMarkdown>
              </div>
            : <p style={{ fontSize: '0.9rem', color: '#5B7480' }}>{t('storyPlaceholder')}</p>
          }
          {artisan.bio && (
            <div className="rich-text" style={{ fontSize: '0.88rem', lineHeight: 1.75, color: '#5B7480', marginTop: '1.5rem', borderTop: '1px solid #C7D2D6', paddingTop: '1.5rem' }}>
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{artisan.bio}</ReactMarkdown>
            </div>
          )}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #C7D2D6', paddingTop: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5B7480', marginBottom: 8 }}>{t('craftDetails')}</div>
            <div style={{ fontSize: '0.88rem', color: '#16303A', lineHeight: 2 }}>
              <div>🎨 <strong>{t('craftLabel')}</strong> {artisan.craft}</div>
              <div>📍 <strong>{t('stateLabel')}</strong> {artisan.state}</div>
              {artisan.gi_product && <div>✦ <strong>{t('giProductLabel')}</strong> {artisan.gi_product}</div>}
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.6rem', fontWeight: 600, color: '#16303A', marginBottom: '1.5rem' }}>
            {t('productsBy')} {artisan.name}
          </h2>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#F5F7F6', borderRadius: 10, border: '1.5px solid #C7D2D6', color: '#5B7480' }}>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem' }}>{t('noProducts')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width: 768px) {
          div[style*="grid-template-columns: 1fr 2fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
