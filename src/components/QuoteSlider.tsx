'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

const PHOTOS = [
  '/quote1.jpeg',
  '/quote2.jpeg',
  '/quote3.jpeg',
  '/quote4.jpeg',
  '/quote5.jpeg',
  '/quote6.jpeg',
  '/quote7.jpeg',
]

export default function QuoteSlider() {
  const { t } = useTranslation('home')
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => setCurrent(c => (c + 1) % PHOTOS.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + PHOTOS.length) % PHOTOS.length), [])

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

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Sliding track */}
      <div style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden', border: '2px solid #DDB840', borderBottom: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{
          display: 'flex',
          transform: `translateX(-${current * 100}%)`,
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}>
          {PHOTOS.map((photo, i) => (
            <div key={i} style={{ minWidth: '100%', height: 320, background: '#FFE8A8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img
                src={photo}
                alt={t('quoteSlideAlt').replace('{n}', String(i + 1))}
                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fixed quote */}
      <div style={{ border: '2px solid #DDB840', borderTop: '2px solid #D4A000', borderRadius: '0 0 16px 16px', background: '#FFFFFF', padding: '1.5rem 1.75rem 1.25rem' }}>
        <div style={{ fontSize: '1.8rem', color: '#E8380A', fontFamily: "'EB Garamond', serif", lineHeight: 0.8, marginBottom: '0.5rem', opacity: 0.5 }}>"</div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', fontStyle: 'italic', color: '#1B2E4A', lineHeight: 1.75, marginBottom: '1rem' }}>
          {t('founderQuote')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 2, background: '#D4A000', borderRadius: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E8380A', fontFamily: "'Lato', sans-serif" }}>Garima Awasthi</div>
            <div style={{ fontSize: '0.7rem', color: '#A07840', fontFamily: "'Lato', sans-serif", marginTop: 1 }}>{t('founderRole')}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: '1rem' }}>
        <button onClick={() => { prev(); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #DDB840', background: '#FFFFFF', cursor: 'pointer', color: '#A07840', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ‹
        </button>
        {PHOTOS.map((_, i) => (
          <button key={i} onClick={() => { setCurrent(i); resetTimer() }}
            style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 4, background: i === current ? '#E8380A' : '#DDB840', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
        ))}
        <button onClick={() => { next(); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #DDB840', background: '#FFFFFF', cursor: 'pointer', color: '#A07840', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ›
        </button>
      </div>
    </div>
  )
}
