'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const SLIDES = [
  {
    photo: '/quote1.jpeg',
    quote: "When a woman artisan earns her first digital payment, she doesn't just gain income — she gains identity, visibility, and power.",
    name: 'Garima Awasthi',
    role: 'Founder, KalaStree · PhD Scholar, IIT Patna',
  },
  {
    photo: '/quote2.jpeg',
    quote: "India has 478 GI-tagged products and millions of women behind them. Yet their names are unknown. KalaStree exists to change that.",
    name: 'Garima Awasthi',
    role: 'IIT Patna · FinTech & Women Empowerment Researcher',
  },
  {
    photo: '/quote3.jpeg',
    quote: "FinTech is not just a tool for the urban elite — it is the lifeline that women artisans in remote India have been waiting for.",
    name: 'Garima Awasthi',
    role: 'From the PhD Research, 2025 · Springer LNNS',
  },
]

export default function QuoteSlider() {
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const [key, setKey] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number, direction: 'next' | 'prev' = 'next') => {
    setDir(direction)
    setKey(k => k + 1)
    setCurrent(idx)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 'next')
  }, [current, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, 'prev')
  }, [current, goTo])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 5000)
  }, [next])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) {
      if (delta > 0) { next(); resetTimer() }
      else { prev(); resetTimer() }
    }
    touchStartX.current = null
  }

  const slide = SLIDES[current]

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Slide */}
      <div
        key={key}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '2px solid #D9C9A8',
          background: '#FFFEF9',
          animation: `${dir === 'next' ? 'slideFromRight' : 'slideFromLeft'} 0.45s cubic-bezier(0.25,0.8,0.25,1) both`,
        }}
      >
        {/* Full photo */}
        <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
          <img
            src={slide.photo}
            alt={slide.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Quote below photo */}
        <div style={{ padding: '1.5rem 1.75rem 1.25rem', borderTop: '2px solid #B8860B' }}>
          <div style={{ fontSize: '1.8rem', color: '#C94B1A', fontFamily: "'EB Garamond', serif", lineHeight: 0.8, marginBottom: '0.5rem', opacity: 0.5 }}>"</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', fontStyle: 'italic', color: '#1B2E4A', lineHeight: 1.75, marginBottom: '1rem' }}>
            {slide.quote}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 2, background: '#B8860B', borderRadius: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#C94B1A', fontFamily: "'Lato', sans-serif" }}>{slide.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#9A8E7A', fontFamily: "'Lato', sans-serif", marginTop: 1 }}>{slide.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '1rem' }}>
        <button onClick={() => { prev(); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #D9C9A8', background: '#FFFEF9', cursor: 'pointer', color: '#9A8E7A', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ‹
        </button>

        {SLIDES.length <= 5
          ? SLIDES.map((_, i) => (
              <button key={i} onClick={() => { goTo(i, i > current ? 'next' : 'prev'); resetTimer() }}
                style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4, background: i === current ? '#C94B1A' : '#D9C9A8', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
            ))
          : <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.8rem', color: '#9A8E7A', minWidth: 40, textAlign: 'center' }}>
              {current + 1} / {SLIDES.length}
            </span>
        }

        <button onClick={() => { next(); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #D9C9A8', background: '#FFFEF9', cursor: 'pointer', color: '#9A8E7A', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ›
        </button>
      </div>

      <style>{`
        @keyframes slideFromRight {
          from { opacity: 0; transform: translateX(80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideFromLeft {
          from { opacity: 0; transform: translateX(-80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
