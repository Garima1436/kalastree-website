'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const AUTO_MS = 5000

type StatKey = 'gi-products' | 'women-artisans' | 'states' | 'marketplace'

const STATS: { key: StatKey; num: string; label: string; sub: string }[] = [
  { key: 'gi-products', num: '478', label: 'GI PRODUCTS', sub: 'Authentic. Verified. Unique.' },
  { key: 'women-artisans', num: '2,500+', label: 'WOMEN ARTISANS', sub: 'Empowered. Skilled. Proud.' },
  { key: 'states', num: '16', label: 'STATES', sub: 'Diverse. Rich. United.' },
  { key: 'marketplace', num: 'GLOBAL', label: 'MARKETPLACE', sub: 'Bringing India to the World.' },
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
  const stateName = stateNameFromSrc(src)
  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(320px, 44vw, 560px)', background: '#3D0810', overflow: 'hidden' }}>
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
        aria-label={`Shop GI products from ${stateName}`}
      />
      <div style={{ position: 'absolute', left: '6%', bottom: '10%', maxWidth: 420, pointerEvents: 'none' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
          GI Heritage of
        </p>
        <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', fontWeight: 700, color: '#fff', margin: '0 0 1rem', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
          {stateName}
        </h3>
        <span style={{ display: 'inline-block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fff', textDecoration: 'underline', textUnderlineOffset: 4 }}>
          SHOP NOW →
        </span>
      </div>
    </div>
  )
}

function BrandSlide() {
  return (
    <div style={{ position: 'relative', padding: '3.5rem 5%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(120,20,30,0.6) 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/kalastree-logo.png" alt="KalaStree — Heritage by Her"
            style={{ height: 'clamp(200px, 32vw, 360px)', width: 'auto', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 0 40px rgba(212,160,0,0.3))' }} />
        </div>

        <p className="hero-desc" style={{ fontSize: 'clamp(0.92rem, 1.8vw, 1.1rem)', lineHeight: 1.9, color: 'rgba(255,255,255,0.85)', maxWidth: 580, margin: '0 auto 2rem' }}>
          India's first GI-verified marketplace where every purchase goes{' '}
          <strong style={{ color: '#D4A000' }}>directly to the woman who made it</strong> — no middlemen, no compromise.
        </p>

        <div className="hero-btns" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" style={{ background: '#D4A000', color: '#1A0800', padding: '14px 34px', borderRadius: 6, fontFamily: "'Lato', sans-serif", fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(212,160,0,0.4)' }}>
            Shop the Collection →
          </Link>
          <Link href="/artisans" style={{ background: 'transparent', color: '#fff', padding: '14px 34px', borderRadius: 6, border: '2px solid rgba(255,255,255,0.5)', fontFamily: "'Lato', sans-serif", fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Meet the Artisans
          </Link>
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
  const [index, setIndex] = useState(0)
  const [height, setHeight] = useState<number>()
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slideCount = 1 + heroImages.length
  const onBrand = index === 0

  useEffect(() => {
    const el = slideRefs.current[index]
    if (el) setHeight(el.offsetHeight)
  }, [index])

  useEffect(() => {
    if (slideCount <= 1) return
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % slideCount), AUTO_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slideCount])

  const go = (next: number) => setIndex(((next % slideCount) + slideCount) % slideCount)

  return (
    <section style={{ background: onBrand ? '#5C0A14' : 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF6 55%, #F3ECDD 100%)', transition: 'background 0.8s ease', position: 'relative', overflow: 'hidden' }}>
      {/* Premium shine, fades in once past the brand slide */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        opacity: onBrand ? 0 : 1, transition: 'opacity 0.8s ease',
        background: 'radial-gradient(ellipse 60% 45% at 22% 0%, rgba(255,255,255,0.95) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(212,160,0,0.1) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', height, transition: 'height 0.5s ease', zIndex: 2 }}>
        <div style={{ display: 'flex', width: '100%', transform: `translateX(-${index * 100}%)`, transition: 'transform 0.6s cubic-bezier(0.65,0,0.35,1)' }}>
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
              aria-label="Previous slide"
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
              aria-label="Next slide"
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
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => go(i)}
                  style={{
                    width: i === index ? 22 : 8, height: 8, borderRadius: 4,
                    background: i === index ? '#D4A000' : 'rgba(255,255,255,0.5)',
                    border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.3s, background 0.3s',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats bar — each cell shows its own background image with text overlaid */}
      <div style={{ borderTop: `1px solid ${onBrand ? 'rgba(212,160,0,0.25)' : 'rgba(139,94,30,0.2)'}`, transition: 'border-color 0.8s ease', position: 'relative', zIndex: 2 }}>
        <div className="stats-grid" style={{ display: 'flex', width: '100%' }}>
          {STATS.map(({ key, num, label, sub }, i) => {
            const bg = statsImages[key]
            return (
              <div
                key={key}
                className="stats-cell"
                style={{
                  flex: '1 1 0', minWidth: 0, position: 'relative', overflow: 'hidden',
                  padding: 'clamp(0.9rem,2vw,1.5rem) clamp(0.5rem,1.5vw,1.2rem)',
                  borderLeft: i > 0 ? `1px solid ${onBrand ? 'rgba(212,160,0,0.2)' : 'rgba(139,94,30,0.15)'}` : 'none',
                  transition: 'border-color 0.8s ease',
                }}
              >
                {bg && (
                  <>
                    <Image src={bg} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" style={{ objectFit: 'cover', objectPosition: 'center' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(26,8,0,0.35) 0%, rgba(26,8,0,0.75) 100%)' }} />
                  </>
                )}
                <div style={{ position: 'relative', minWidth: 0 }}>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.1rem,2.8vw,1.9rem)', fontWeight: 700, color: '#D4A000', lineHeight: 1, whiteSpace: 'nowrap' }}>{num}</div>
                  <div style={{ fontSize: 'clamp(0.48rem,1.1vw,0.65rem)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: bg || onBrand ? '#fff' : '#3A1C08', transition: 'color 0.8s ease', marginTop: 3 }}>{label}</div>
                  <div className="stat-sub" style={{ fontSize: 'clamp(0.48rem,1vw,0.6rem)', color: bg ? 'rgba(212,160,0,0.85)' : onBrand ? 'rgba(212,160,0,0.65)' : 'rgba(139,94,30,0.8)', transition: 'color 0.8s ease', marginTop: 2, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{sub}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media(max-width:600px){
          .hero-btns a { padding:12px 20px !important; font-size:0.85rem !important; width:100%; justify-content:center; }
          .hero-btns  { flex-direction:column !important; align-items:stretch !important; }
        }
        @media(max-width:640px){
          .stats-grid { flex-wrap: wrap; }
          .stats-cell { flex: 0 0 50% !important; }
          .stats-cell:nth-child(3) { border-left: none !important; }
          .stats-cell:nth-child(3), .stats-cell:nth-child(4) { border-top: 1px solid rgba(212,160,0,0.2); }
          .stat-sub { white-space: normal !important; }
        }
      `}</style>
    </section>
  )
}
