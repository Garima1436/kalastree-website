'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const SLIDES = [
  {
    photo: '/quote1.jpeg',   // replace with your photo file in /public
    quote: "When a woman artisan earns her first digital payment, she doesn't just gain income — she gains identity, visibility, and power.",
    name: 'Garima Awasthi',
    role: 'Founder, KalaStree · PhD Scholar, IIT Patna',
  },
  {
    photo: '/quote2.jpeg',   // replace with your photo file in /public
    quote: "India has 478 GI-tagged products and millions of women behind them. Yet their names are unknown. KalaStree exists to change that.",
    name: 'Garima Awasthi',
    role: 'IIT Patna · FinTech & Women Empowerment Researcher',
  },
  {
    photo: '/quote3.jpeg',   // replace with your photo file in /public
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
    <div style={{ marginTop: '2.5rem', position: 'relative', userSelect: 'none' }}>
      <div
        key={key}
        className="quote-slider-inner"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: '#FFFEF9',
          border: '2px solid #D9C9A8',
          borderRadius: 16,
          overflow: 'hidden',
          animation: `${dir === 'next' ? 'slideFromRight' : 'slideFromLeft'} 0.45s cubic-bezier(0.25,0.8,0.25,1) both`,
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          minHeight: 180,
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #F2E8D5, #E8D9C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '3px solid #B8860B', boxShadow: '0 4px 20px rgba(184,134,11,0.25)', flexShrink: 0 }}>
            <img src={slide.photo} alt={slide.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 32, height: 3, background: '#B8860B', borderRadius: 2 }} />
          </div>
        </div>

        {/* Quote */}
        <div style={{ padding: '2rem 2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: '#C94B1A', fontFamily: "'EB Garamond', serif", lineHeight: 0.8, marginBottom: '0.6rem', opacity: 0.6 }}>"</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', fontStyle: 'italic', color: '#1B2E4A', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            {slide.quote}
          </p>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C94B1A', fontFamily: "'Lato', sans-serif" }}>{slide.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#9A8E7A', fontFamily: "'Lato', sans-serif", marginTop: 2 }}>{slide.role}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '1.25rem' }}>
        <button onClick={() => { prev(); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #D9C9A8', background: '#FFFEF9', cursor: 'pointer', color: '#9A8E7A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ‹
        </button>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => { goTo(i, i > current ? 'next' : 'prev'); resetTimer() }}
            style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4, background: i === current ? '#C94B1A' : '#D9C9A8', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
        ))}
        <button onClick={() => { next(); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #D9C9A8', background: '#FFFEF9', cursor: 'pointer', color: '#9A8E7A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        @media(max-width: 600px) {
          .quote-slider-inner { grid-template-columns: 1fr !important; }
          .quote-slider-inner > div:first-child { padding: 1.25rem 1rem 0.5rem !important; }
        }
      `}</style>
    </div>
  )
}
