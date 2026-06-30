'use client'
import Image from 'next/image'
import { useRef, useState, useCallback } from 'react'

interface HeroCarouselProps {
  images: string[]
}

function CarouselCard({ src }: { src: string }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 190,
      height: 260,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(26,10,0,0.18)',
      position: 'relative',
      border: '2px solid rgba(184,134,11,0.2)',
    }}>
      <Image
        src={src}
        alt="GI artisan"
        fill
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        sizes="190px"
        draggable={false}
      />
    </div>
  )
}

export default function HeroCarousel({ images }: HeroCarouselProps) {
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setPaused(true)
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null
    setPaused(false)
  }, [])

  if (images.length === 0) {
    return (
      <div style={{
        width: '100%', height: 540, borderRadius: 20,
        background: 'linear-gradient(135deg, #F2E8D5, #EDE0C8)',
        border: '2px dashed #D9C9A8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, color: '#9A8E7A',
      }}>
        <span style={{ fontSize: '2.5rem' }}>🖼️</span>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', maxWidth: 220 }}>
          Add images to<br />
          <code style={{ background: '#EDE0C8', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>public/hero/</code>
          <br />to display here
        </p>
      </div>
    )
  }

  // Ensure enough copies for a seamless loop regardless of how many images the user adds
  const minCount = Math.max(images.length, 6)
  const copies = Math.ceil(minCount / images.length)
  const base = Array(copies).fill(images).flat()
  const track1 = [...base, ...base]               // duplicated for seamless left scroll
  const track2 = [...base.slice().reverse(), ...base.slice().reverse()] // reversed, scrolls right

  const speed1 = images.length * 4    // ~seconds — scales with image count
  const speed2 = images.length * 5

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '6px 0',
        // Fade edges for a polished look
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        cursor: paused ? 'grab' : 'default',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Row 1 — scrolls left */}
      <div style={{
        display: 'flex',
        gap: 12,
        width: 'max-content',
        animation: `ksCarouselLeft ${speed1}s linear infinite`,
        animationPlayState: paused ? 'paused' : 'running',
        willChange: 'transform',
      }}>
        {track1.map((src, i) => <CarouselCard key={i} src={src} />)}
      </div>

      {/* Row 2 — scrolls right */}
      <div style={{
        display: 'flex',
        gap: 12,
        width: 'max-content',
        animation: `ksCarouselRight ${speed2}s linear infinite`,
        animationPlayState: paused ? 'paused' : 'running',
        willChange: 'transform',
      }}>
        {track2.map((src, i) => <CarouselCard key={i} src={src} />)}
      </div>

      <style>{`
        @keyframes ksCarouselLeft {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes ksCarouselRight {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
