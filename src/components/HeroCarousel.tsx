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

function ImageSlide({ src, priority }: { src: string; priority?: boolean }) {
  const { t } = useTranslation('home')
  const stateName = stateNameFromSrc(src)
  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(220px, 62vw, 560px)', background: '#3D0810', overflow: 'hidden' }}>
      <Image
        src={src}
        alt=""
        fill
        aria-hidden
        style={{ objectFit: 'cover', objectPosition: 'center', filter: 'blur(28px) brightness(0.7) saturate(1.2)', transform: 'scale(1.15)' }}
        sizes="100vw"
        draggable={false}
      />
      <Image
        src={src}
        alt={stateName}
        fill
        priority={priority}
        style={{ objectFit: 'contain', objectPosition: 'center' }}
        sizes="100vw"
        draggable={false}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(26,8,0,0.55) 0%, rgba(26,8,0,0.1) 45%, transparent 72%)', pointerEvents: 'none' }} />
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

const BRAND_PHOTOS = ['/hero/hero1.jpeg', '/hero/hero2.jpeg', '/hero/hero3.jpeg']
// Each entry is 'horizontal% vertical%' for photo 1/2/3 in order — this is your left/right and up/down control.
//   Horizontal: 0% = shows the LEFT side of the photo (crops the right off) · 100% = shows the RIGHT side (crops the
//   left off) · 50% = centered. To move a photo's visible content LEFT, LOWER the number; to move it RIGHT, RAISE it.
//   Vertical: 0% = TOP of the photo · 100% = BOTTOM · 50% = centered. Same rule: lower = up, higher = down.
const BRAND_PHOTO_POSITION = ['58% 40%', '50% 26%', '50% 15%']
// Per-photo crop mode: 'cover' fills the slot edge-to-edge but crops whatever doesn't fit (use BRAND_PHOTO_POSITION to
// choose which part survives). 'contain' shows the ENTIRE photo with nothing cropped, but leaves blank gaps on the
// sides of that slot since the photo won't be wide enough to fill it — those gaps break the seamless full-bleed look,
// so use 'contain' only if showing 100% of that one photo matters more than the seamless edge-to-edge band.
const BRAND_PHOTO_FIT: Array<'cover' | 'contain'> = ['cover', 'cover', 'cover']
// Extra zoom per photo (1 = no extra zoom). On wide desktop screens the photo box is often wider (relative to its
// height) than the photo itself, so 'cover' shows the photo's FULL width with nothing left to pan through — at that
// point BRAND_PHOTO_POSITION's left/right number has no effect because there's no slack. Raising a photo's zoom here
// (e.g. 1.3, 1.5) crops in further on purpose, creating room to pan, and then BRAND_PHOTO_POSITION starts working
// again. Zooms in from the same point BRAND_PHOTO_POSITION points at, so adjust position first, then zoom.
const BRAND_PHOTO_ZOOM = [1.2, 1, 1]
function BrandSlide() {
  const { t } = useTranslation('home')
  return (
    <div style={{ position: 'relative', height: 'clamp(220px, 62vw, 560px)', overflow: 'hidden' }}>
      {/*
        Three artisan photos fill the entire slide — same dimensions as the other slides. The outer two are full-
        opacity rectangles (photo1: 0-50% width, photo3: 50-100%), and the middle photo sits centered on top
        (25-75% width) with its own edges faded out. Because the outer photos' inner edges (50%) sit safely INSIDE
        the middle photo's opaque zone (40-60%), there's always an opaque photo directly behind every pixel of the
        fade — no gap can ever show through to the page background, so the seam always blends cleanly regardless of
        which photos are swapped in.
      */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 1, overflow: 'hidden' }}>
          <Image src={BRAND_PHOTOS[0]} alt="" fill priority sizes="50vw" style={{ objectFit: BRAND_PHOTO_FIT[0], objectPosition: BRAND_PHOTO_POSITION[0], transform: `scale(${BRAND_PHOTO_ZOOM[0]})`, transformOrigin: BRAND_PHOTO_POSITION[0] }} draggable={false} />
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 1, overflow: 'hidden' }}>
          <Image src={BRAND_PHOTOS[2]} alt="" fill sizes="50vw" style={{ objectFit: BRAND_PHOTO_FIT[2], objectPosition: BRAND_PHOTO_POSITION[2], transform: `scale(${BRAND_PHOTO_ZOOM[2]})`, transformOrigin: BRAND_PHOTO_POSITION[2] }} draggable={false} />
        </div>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '25%', width: '50%', zIndex: 2, overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)',
        }}>
          <Image src={BRAND_PHOTOS[1]} alt="" fill sizes="50vw" style={{ objectFit: BRAND_PHOTO_FIT[1], objectPosition: BRAND_PHOTO_POSITION[1], transform: `scale(${BRAND_PHOTO_ZOOM[1]})`, transformOrigin: BRAND_PHOTO_POSITION[1] }} draggable={false} />
        </div>
      </div>

      {/* Subtle dark vignette — just enough for the logo/text to stay legible over any photo */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 100%)',
      }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 5%' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(0.3rem, 1vw, 0.6rem)' }}>
            <img src="/kalastree-logo.png" alt={`KalaStree — ${t('heritageByHer')}`}
              style={{ height: 'clamp(70px, 16vw, 160px)', width: 'auto', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }} />
          </div>

          <p className="hero-desc" style={{ fontSize: 'clamp(0.72rem, 1.4vw, 1rem)', lineHeight: 1.6, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.6)', maxWidth: 560, margin: '0 auto clamp(0.6rem, 1.5vw, 1.2rem)' }}>
            {t('heroDescPrefix')}{' '}
            <strong style={{ color: '#FFC24B' }}>{t('heroDescHighlight')}</strong> {t('heroDescSuffix')}
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" style={{ background: '#E8380A', color: '#fff', padding: 'clamp(8px,1.5vw,14px) clamp(16px,3vw,34px)', borderRadius: 6, fontFamily: "'Lato', sans-serif", fontSize: 'clamp(0.75rem,1.3vw,0.95rem)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
              {t('shopTheCollection')} →
            </Link>
            <Link href="/artisans" style={{ background: 'rgba(0,0,0,0.15)', color: '#fff', padding: 'clamp(8px,1.5vw,14px) clamp(16px,3vw,34px)', borderRadius: 6, border: '2px solid rgba(255,255,255,0.8)', fontFamily: "'Lato', sans-serif", fontSize: 'clamp(0.75rem,1.3vw,0.95rem)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {t('meetTheArtisans')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeroSectionProps {
  heroImages: string[]
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
          {heroImages.map((src, i) => (
            <div key={src} ref={el => { slideRefs.current[i + 1] = el }} style={{ flex: '0 0 100%', width: '100%', minWidth: 0 }}>
              <ImageSlide src={src} priority={i === 0} />
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
