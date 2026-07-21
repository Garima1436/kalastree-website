import { supabase } from '@/lib/supabase'
import type { Product, Artisan, Category } from '@/lib/types'
import ProductCarousel from '@/components/ProductCarousel'
import ArtisanCard from '@/components/ArtisanCard'
import CategoryGrid from '@/components/CategoryGrid'
import HeroSection from '@/components/HeroCarousel'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getServerLang, getT } from '@/lib/i18n/server'

export const revalidate = 300

// Reads just enough of a JPEG/PNG file's header to get its pixel dimensions — avoids pulling in an image-processing
// dependency just to read two numbers. Falls back to a 16:9 guess for formats it doesn't parse (webp/avif/gif).
function getImageAspectRatio(filePath: string): string {
  try {
    const fd = fs.openSync(filePath, 'r')
    const buffer = Buffer.alloc(65536)
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0)
    fs.closeSync(fd)

    if (buffer.toString('ascii', 1, 4) === 'PNG') {
      return `${buffer.readUInt32BE(16)} / ${buffer.readUInt32BE(20)}`
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2
      while (offset < bytesRead - 9) {
        if (buffer[offset] !== 0xFF) { offset++; continue }
        const marker = buffer[offset + 1]
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          return `${buffer.readUInt16BE(offset + 7)} / ${buffer.readUInt16BE(offset + 5)}`
        }
        offset += 2 + buffer.readUInt16BE(offset + 2)
      }
    }
  } catch {}
  return '16 / 9'
}

function getHeroImages(): { src: string; aspectRatio: string }[] {
  try {
    const dir = path.join(process.cwd(), 'public', 'hero')
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp|avif|gif)$/i.test(f) && !/^hero(\d+|-main)\./i.test(f))
      .sort()
      .map(f => ({ src: `/hero/${f}`, aspectRatio: getImageAspectRatio(path.join(dir, f)) }))
  } catch {
    return []
  }
}

const CATEGORY_KEYS: Category[] = ['textile', 'handicraft', 'agricultural', 'food']

function getCategoryImages(): Partial<Record<Category, string>> {
  const result: Partial<Record<Category, string>> = {}
  try {
    const dir = path.join(process.cwd(), 'public', 'categories')
    if (!fs.existsSync(dir)) return result
    const files = fs.readdirSync(dir)
    for (const key of CATEGORY_KEYS) {
      const match = files.find(f => new RegExp(`^${key}\\.(jpe?g|png|webp|avif)$`, 'i').test(f))
      if (match) result[key] = `/categories/${match}`
    }
  } catch {
    // ignore
  }
  return result
}

type StatKey = 'gi-products' | 'women-artisans' | 'states' | 'marketplace'
const STAT_KEYS: StatKey[] = ['gi-products', 'women-artisans', 'states', 'marketplace']

function getStatsImages(): Partial<Record<StatKey, string>> {
  const result: Partial<Record<StatKey, string>> = {}
  try {
    const dir = path.join(process.cwd(), 'public', 'stats')
    if (!fs.existsSync(dir)) return result
    const files = fs.readdirSync(dir)
    for (const key of STAT_KEYS) {
      const match = files.find(f => new RegExp(`^${key}\\.(jpe?g|png|webp|avif)$`, 'i').test(f))
      if (match) result[key] = `/stats/${match}`
    }
  } catch {
    // ignore
  }
  return result
}

async function getData() {
  const [{ data: products }, { data: artisans }] = await Promise.all([
    supabase.from('products').select('*, artisan:artisans(*)').eq('is_featured', true).eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
    supabase.from('artisans').select('*').eq('is_featured', true).limit(6),
  ])
  return { products: (products ?? []) as Product[], artisans: (artisans ?? []) as Artisan[] }
}

export default async function HomePage() {
  const { products, artisans } = await getData()
  const heroImages = getHeroImages()
  const categoryImages = getCategoryImages()
  const statsImages = getStatsImages()
  const lang = await getServerLang()
  const t = getT('home', lang)

  return (
    <>
      {/* HERO — swipable: branded slide first, then state images, background shifts after slide 1 */}
      <HeroSection heroImages={heroImages} statsImages={statsImages} />

      {/* Marigold promo strip */}
      <div style={{ background: '#D4A000', padding: '11px 5%', textAlign: 'center', overflow: 'hidden' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A0800', margin: 0 }}>
          {t('promoStrip')}
        </p>
      </div>

      {/* <ComingSoonRibbon /> */}

      {/* GI CATEGORIES */}
      <section style={{ padding: '2.5rem 5% 5rem', background: '#FAF7F2' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="folk-divider" style={{ margin: '0 0 1rem' }}><span>✦ ✧ ✦</span></div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', textAlign: 'center', marginBottom: '0.6rem' }}>{t('categoryEyebrow')}</p>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A', textAlign: 'center', marginBottom: '3rem' }}>
            {t('categoryHeadingPrefix')} <span style={{ color: '#E8380A' }}>{t('categoryHeadingHighlight')}</span>
          </h2>
          <CategoryGrid categoryImages={categoryImages} />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: '2.5rem 5% 5rem', background: 'var(--parchment)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.4rem' }}>{t('featuredEyebrow')}</p>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A' }}>
                {t('featuredHeadingPrefix')} <span style={{ color: '#E8380A' }}>{t('featuredHeadingHighlight')}</span>
              </h2>
            </div>
            <Link href="/shop" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#E8380A', textDecoration: 'none', border: '1.5px solid #E8380A', padding: '8px 20px', borderRadius: 4 }}>
              {t('viewAllProductsLink')} →
            </Link>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B4820' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>{t('productsComingSoon')} <Link href="/join" style={{ color: '#E8380A' }}>{t('joinAsArtisanLink')} →</Link></p>
            </div>
          ) : (
            <ProductCarousel products={products} />
          )}
        </div>
      </section>

      {/* MISSION STRIP */}
      <section style={{ background: '#1B2E4A', padding: '1rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='10' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3Ccircle cx='10' cy='30' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='30' r='3'/%3E%3Ccircle cx='10' cy='50' r='3'/%3E%3Ccircle cx='30' cy='50' r='3'/%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', position: 'relative', zIndex: 1 }}>
          {[
            { icon: '✅', title: t('missionGiTitle'), body: t('missionGiBody') },
            { icon: '🌾', title: t('missionWomenTitle'), body: t('missionWomenBody') },
            { icon: '🤖', title: t('missionAiTitle'), body: t('missionAiBody') },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{title}</div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARTISANS */}
      {artisans.length > 0 && (
        <section style={{ padding: '2.5rem 5% 5rem', background: '#FAF7F2' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.4rem' }}>{t('artisansEyebrow')}</p>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A' }}>
                {t('artisansHeadingPrefix')} <span style={{ color: '#E8380A' }}>{t('artisansHeadingHighlight')}</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/artisans" style={{ background: '#E8380A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                {t('viewAllArtisansLink')} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA — Join as Artisan */}
      <section style={{ padding: '5rem 5%', background: '#C8F5D8' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧵</div>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1A7A32', marginBottom: '1rem' }}>
            {t('ctaHeading')}
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#6B4820', marginBottom: '2rem' }}>
            {t('ctaBody')}
          </p>
          <Link href="/join" style={{ background: '#1A7A32', color: '#fff', padding: '14px 32px', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '1rem', display: 'inline-block' }}>
            {t('ctaButton')} →
          </Link>
        </div>
      </section>
    </>
  )
}
