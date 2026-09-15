'use client'

import { useEffect, useState } from 'react'

const DEFAULT_MESSAGE = 'Hi KalaStree team, I have a query about your GI-verified products/artisans.'

// Stacked directly above ChatWidget's floating action button (56px, at
// bottom:24/right:24 — see ChatWidget.tsx) with a 12px gap between them.
export default function WhatsAppButton({ number, message }: { number: string | null; message?: string | null }) {
  // The chat panel opens right over this spot (bottom:88, up to 520px tall)
  // but is DOM-rendered before this component, so at the same z-index this
  // button was still winning the stacking tie and floating on top of it —
  // see ChatWidget.tsx's dispatch of this same event for why a window event
  // is used instead of shared parent state.
  const [chatOpen, setChatOpen] = useState(false)
  useEffect(() => {
    const onChange = (e: Event) => setChatOpen((e as CustomEvent<boolean>).detail)
    window.addEventListener('kalastree:chat-open-change', onChange)
    return () => window.removeEventListener('kalastree:chat-open-change', onChange)
  }, [])

  if (!number || chatOpen) return null

  const digitsOnly = number.replace(/[^\d]/g, '')
  const text = message?.trim() || DEFAULT_MESSAGE
  const href = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message us on WhatsApp"
        style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)' }}
        className="whatsapp-fab"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm0 18.12h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.21 8.21 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.26-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.27-8.24 8.27Zm4.52-6.19c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.96-.15.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.24-.87.85-.87 2.08 0 1.22.89 2.4 1.02 2.57.12.16 1.75 2.68 4.25 3.75.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/>
        </svg>
      </a>
      <style>{`
        @media(max-width:480px){
          .whatsapp-fab { bottom:70px !important; right:12px !important; width:48px !important; height:48px !important; }
        }
      `}</style>
    </>
  )
}
