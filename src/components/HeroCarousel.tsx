'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

const AUTO_MS = 5000

type StatKey = 'gi-products' | 'women-artisans' | 'states' | 'marketplace'

const STATS: { key: StatKey; num: string }[] = [
  { key: 'gi-products', num: '478' },
  { key: 'women-artisans', num: '2,500+' },
  { key: 'states', num: '16' },
  { key: 'marketplace', num: 'GLOBAL' },
]

const STATE_NAME_MAP: Record<string, string> = {
  bihar: 'Bihar',
  punjab: 'Punjab',
  mp: 'Madhya Pradesh',
  up: 'Uttar Pradesh',
}

function stateNameFromSrc(src: string): string {
  const file = src.split('/').pop() || ''
  const key = file.replace(/\.[^.]+$/, '').toLowerCase()
  return STATE_NAME_MAP[key] || (key.length <= 3 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1))
}

function ImageSlide({ src, aspectRatio, priority }: { src: string; aspectRatio: string; priority?: boolean }) {
  const { t } = useTranslation('home')
  const stateName = stateNameFromSrc(src)
  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(220px, 62vw, 560px)', background: '#FFFFFF', overflow: 'hidden' }}>
      {/* Sized to the photo's own ratio and centered — keeps the photo AND its gradient from ever painting over the white margins */}
      <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 'auto', height: '100%', maxWidth: '100%', aspectRatio }}>
        <Image
          src={src}
          alt={stateName}
          fill
          priority={priority}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          sizes="100vw"
          draggable={false}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(26,8,0,0.55) 0%, rgba(26,8,0,0.1) 45%, transparent 72%)', pointerEvents: 'none' }} />
      </div>
      <Link
        href={`/shop?state=${encodeURIComponent(stateName)}`}
        style={{ position: 'absolute', inset: 0, zIndex: 2 }}
        aria-label={t('shopGiProductsFrom').replace('{state}', stateName)}
      />
      <div style={{ position: 'absolute', left: '6%', bottom: '10%', maxWidth: 420, pointerEvents: 'none' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
          {t('giHeritageOf')}
        </p>
        <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', fontWeight: 700, color: '#fff', margin: '0 0 1rem', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
          {stateName}
        </h3>
        <span style={{ display: 'inline-block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fff', textDecoration: 'underline', textUnderlineOffset: 4 }}>
          {t('shopNow')} →
        </span>
      </div>
    </div>
  )
}

const BRAND_PHOTO = '/hero/hero-main.png'
function BrandSlide() {
  const { t } = useTranslation('home')
  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(220px, 62vw, 560px)', background: '#FFFFFF', overflow: 'hidden' }}>
      {/* Sized to the photo's own ratio and centered — keeps the photo from ever painting over the white margins */}
      <div style={{ position: 'absolute', inset: 0, margin: 'auto', width: 'auto', height: '100%', maxWidth: '100%', aspectRatio: '1672 / 941' }}>
        <Image src={BRAND_PHOTO} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center' }} draggable={false} />
      </div>

      <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 5% clamp(0.6rem, 2vw, 1.25rem)' }}>
        {/* Sized to its own content (not the photo) so the wave backdrop always
            hugs the logo/description/buttons regardless of viewport width. */}
        <div style={{ position: 'relative', maxWidth: 820, textAlign: 'center', padding: 'clamp(1.5rem, 4.5vw, 2.5rem) clamp(1.75rem, 6vw, 3.5rem)' }}>
          {/* Soft feathered glow, not a shape with an edge — fades all the way to
              transparent with no hard boundary anywhere, so there's nothing for a
              busy photo to clash against. Sized via the padding above, tight to the
              actual logo/description/buttons rather than a large fixed card. */}
          <div style={{
            position: 'absolute', inset: '-8%', zIndex: -1, pointerEvents: 'none',
            background: 'radial-gradient(ellipse farthest-corner at 50% 46%, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.95) 25%, rgba(255,255,255,0.65) 42%, rgba(255,255,255,0.15) 57%, rgba(255,255,255,0) 78%)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(0.15rem, 0.6vw, 0.35rem)' }}>
            <img src="/kalastree-logo.png" alt={`KalaStree — ${t('heritageByHer')}`}
              style={{ height: 'clamp(50px, 8.8vw, 92px)', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>

          <p className="hero-desc" style={{ fontSize: 'clamp(0.85rem, 1.2vw, 0.94rem)', lineHeight: 1.45, color: '#030303', maxWidth: 560, margin: '0 auto clamp(0.35rem, 1vw, 0.7rem)' }}>
            {t('heroDescPrefix')}{' '}
            <strong style={{ color: '#E8380A' }}>{t('heroDescHighlight')}</strong> {t('heroDescSuffix')}
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" style={{ background: '#E8380A', color: '#fff', padding: 'clamp(6px,1vw,10px) clamp(12px,2.2vw,24px)', borderRadius: 6, fontFamily: "'Lato', sans-serif", fontSize: 'clamp(0.65rem,1vw,0.82rem)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(232,56,10,0.3)' }}>
              {t('shopTheCollection')} →
            </Link>
            <Link href="/artisans" style={{ background: '#E8380A', color: '#fff', padding: 'clamp(6px,1vw,10px) clamp(12px,2.2vw,24px)', borderRadius: 6, border: '2px solid #E8380A', fontFamily: "'Lato', sans-serif", fontSize: 'clamp(0.65rem,1vw,0.82rem)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('meetTheArtisans')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeroSectionProps {
  heroImages: { src: string; aspectRatio: string }[]
  statsImages: Partial<Record<StatKey, string>>
}

export default function HeroSection({ heroImages, statsImages }: HeroSectionProps) {
  const { t } = useTranslation('home')
  const [index, setIndex] = useState(0)
  const [height, setHeight] = useState<number>()
  const [paused, setPaused] = useState(false)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slideCount = 1 + heroImages.length

  useEffect(() => {
    const el = slideRefs.current[index]
    if (el) setHeight(el.offsetHeight)
  }, [index])

  useEffect(() => {
    if (slideCount <= 1 || paused) return
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % slideCount), AUTO_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slideCount, paused])

  const go = (next: number) => setIndex(((next % slideCount) + slideCount) % slideCount)

  const statText: Record<StatKey, { label: string; sub: string }> = {
    'gi-products': { label: t('statGiProductsLabel'), sub: t('statGiProductsSub') },
    'women-artisans': { label: t('statWomenArtisansLabel'), sub: t('statWomenArtisansSub') },
    'states': { label: t('statStatesLabel'), sub: t('statStatesSub') },
    'marketplace': { label: t('statMarketplaceLabel'), sub: t('statMarketplaceSub') },
  }

  return (
    <section style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF6 55%, #F3ECDD 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Premium shine */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse 60% 45% at 22% 0%, rgba(255,255,255,0.95) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(212,160,0,0.1) 0%, transparent 60%)',
      }} />

      <div
        style={{ position: 'relative', width: '100%', overflow: 'hidden', height, transition: 'height 0.5s ease', zIndex: 2 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', transform: `translateX(-${index * 100}%)`, transition: 'transform 0.6s cubic-bezier(0.65,0,0.35,1)' }}>
          <div ref={el => { slideRefs.current[0] = el }} style={{ flex: '0 0 100%', width: '100%', minWidth: 0 }}>
            <BrandSlide />
          </div>
          {heroImages.map(({ src, aspectRatio }, i) => (
            <div key={src} ref={el => { slideRefs.current[i + 1] = el }} style={{ flex: '0 0 100%', width: '100%', minWidth: 0 }}>
              <ImageSlide src={src} aspectRatio={aspectRatio} priority={i === 0} />
            </div>
          ))}
        </div>

        {slideCount > 1 && (
          <>
            <button
              className="hero-arrow"
              aria-label={t('previousSlide')}
              onClick={() => go(index - 1)}
              style={{
                position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', zIndex: 3,
                width: 'clamp(36px, 6vw, 44px)', height: 'clamp(36px, 6vw, 44px)', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.85)', color: '#1A0800', fontSize: '1.3rem', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              ‹
            </button>
            <button
              className="hero-arrow"
              aria-label={t('nextSlide')}
              onClick={() => go(index + 1)}
              style={{
                position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', zIndex: 3,
                width: 'clamp(36px, 6vw, 44px)', height: 'clamp(36px, 6vw, 44px)', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.85)', color: '#1A0800', fontSize: '1.3rem', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              ›
            </button>

            <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 3, display: 'flex', justifyContent: 'center', gap: 8 }}>
              {Array.from({ length: slideCount }).map((_, i) => (
                <button
                  key={i}
                  aria-label={t('goToSlide').replace('{n}', String(i + 1))}
                  onClick={() => go(i)}
                  style={{
                    width: i === index ? 22 : 8, height: 8, borderRadius: 4,
                    background: i === index ? '#D4A000' : 'rgba(139,94,30,0.35)',
                    border: `1px solid ${i === index ? '#D4A000' : 'rgba(212,160,0,0.7)'}`,
                    padding: 0, cursor: 'pointer', transition: 'width 0.3s, background 0.3s, border-color 0.3s',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats bar — each cell shows its own background image with text overlaid */}
      <div style={{ borderTop: '1px solid rgba(139,94,30,0.2)', position: 'relative', zIndex: 2 }}>
        <div className="stats-grid" style={{ display: 'flex', width: '100%' }}>
          {STATS.map(({ key, num }, i) => {
            const bg = statsImages[key]
            const { label, sub } = statText[key]
            const displayNum = key === 'marketplace' ? t('statMarketplaceNum') : num
            return (
              <div
                key={key}
                className="stats-cell"
                style={{
                  flex: '1 1 0', minWidth: 0, position: 'relative', overflow: 'hidden',
                  padding: 'clamp(0.9rem,2vw,1.5rem) clamp(0.5rem,1.5vw,1.2rem)',
                  borderLeft: i > 0 ? '1px solid rgba(139,94,30,0.15)' : 'none',
                }}
              >
                {bg && (
                  <>
                    <Image src={bg} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" style={{ objectFit: 'cover', objectPosition: 'center' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(26,8,0,0.35) 0%, rgba(26,8,0,0.75) 100%)' }} />
                  </>
                )}
                <div style={{ position: 'relative', minWidth: 0 }}>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.1rem,2.8vw,1.9rem)', fontWeight: 700, color: '#D4A000', lineHeight: 1, whiteSpace: 'nowrap' }}>{displayNum}</div>
                  <div style={{ fontSize: 'clamp(0.48rem,1.1vw,0.65rem)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: bg ? '#fff' : '#3A1C08', marginTop: 3 }}>{label}</div>
                  <div className="stat-sub" style={{ fontSize: 'clamp(0.48rem,1vw,0.6rem)', color: bg ? 'rgba(212,160,0,0.85)' : 'rgba(139,94,30,0.8)', marginTop: 2, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{sub}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media(max-width:640px){
          .stat-sub { white-space: normal !important; }
          .hero-arrow { display: none !important; }
        }
      `}</style>
    </section>
  )
}
