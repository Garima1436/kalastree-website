'use client'
import Image from 'next/image'
import { useState } from 'react'

interface HeroCarouselProps {
  images: string[]
}

// All images are 1536×1024 (3:2 landscape). Card dimensions match that ratio.
// JS uses desktop sizes for duration math; CSS overrides for mobile via .ks-card class.
const CARD_H = 300
const CARD_W = Math.round(CARD_H * (3 / 2)) // 450

export default function HeroCarousel({ images }: HeroCarouselProps) {
  const [paused, setPaused] = useState(false)

  if (images.length === 0) {
    return (
      <div style={{
        width: '100%', height: CARD_H, borderRadius: 16,
        background: 'linear-gradient(135deg, #FFE8A8, #EDD060)',
        border: '2px dashed #DDB840',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, color: '#A07840',
      }}>
        <span style={{ fontSize: '2rem' }}>🖼️</span>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}>
          Add images to <code style={{ background: '#EDD060', padding: '2px 5px', borderRadius: 3 }}>public/hero/</code>
        </p>
      </div>
    )
  }

  // Duplicate enough times so the strip is always wider than the viewport
  const copies = Math.max(2, Math.ceil(8 / images.length))
  const base = Array(copies).fill(images).flat() as string[]
  const track = [...base, ...base] // doubled for seamless loop

  const totalWidth = track.length * (CARD_W + 16) // card width + gap
  const halfWidth = totalWidth / 2

  // Speed: ~80px/s feels natural for landscape scroll
  const duration = Math.round(halfWidth / 80)

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        cursor: paused ? 'pointer' : 'default',
        maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          width: 'max-content',
          animation: `ksScroll ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
        }}
      >
        {track.map((src, i) => (
          <div
            key={i}
            className="ks-card"
            style={{
              flexShrink: 0,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 6px 24px rgba(26,10,0,0.16)',
              position: 'relative',
              border: '2px solid rgba(212,160,0,0.18)',
            }}
          >
            <Image
              src={src}
              alt="GI artisan"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              sizes={`${CARD_W}px`}
              draggable={false}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ksScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (max-width: 640px) {
          .ks-card { width: 240px !important; height: 160px !important; border-radius: 10px !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .ks-card { width: 320px !important; height: 213px !important; }
        }
      `}</style>
    </div>
  )
}
