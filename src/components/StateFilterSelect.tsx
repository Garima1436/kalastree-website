'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { INDIAN_STATES } from '@/lib/indian-states'

export default function StateFilterSelect({ current, allLabel }: { current?: string; allLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (state: string) => {
    setOpen(false)
    router.push(state ? `/shop?state=${encodeURIComponent(state)}` : '/shop')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '9px 10px', borderRadius: 6, border: '1.5px solid #DDB840',
          fontSize: '0.85rem', color: '#6B4820', background: '#FFFFFF', fontFamily: "'Inter', sans-serif",
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
        }}
      >
        {current || allLabel}
        <span style={{ fontSize: '0.6rem', color: '#A07840', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 260, overflowY: 'auto',
          background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 8, boxShadow: '0 12px 32px rgba(26,10,0,0.16)', zIndex: 300,
        }}>
          <button
            onClick={() => select('')}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: !current ? '#FFF5E0' : 'transparent', border: 'none', borderBottom: '1px solid #FFE8A8', fontSize: '0.85rem', fontWeight: !current ? 700 : 400, color: !current ? '#E8380A' : '#6B4820', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FFE8A8')}
            onMouseLeave={e => (e.currentTarget.style.background = !current ? '#FFF5E0' : 'transparent')}
          >
            {allLabel}
          </button>
          {INDIAN_STATES.map(state => (
            <button
              key={state}
              onClick={() => select(state)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: current === state ? '#FFF5E0' : 'transparent', border: 'none', borderBottom: '1px solid #FFE8A8', fontSize: '0.85rem', fontWeight: current === state ? 700 : 400, color: current === state ? '#E8380A' : '#6B4820', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FFE8A8')}
              onMouseLeave={e => (e.currentTarget.style.background = current === state ? '#FFF5E0' : 'transparent')}
            >
              {state}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
