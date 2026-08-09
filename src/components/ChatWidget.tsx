'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import chatbotDict from '@/lib/i18n/dictionaries/chatbot'
import type { StructuredQuery, DebugInfo } from '@/lib/intelligence/types'

interface ChatProduct {
  id: string
  name: string
  slug: string
  price: number
  image: string | null
  state: string | null
  giVerified: boolean
  giTag: string | null
  artisan: { name: string; slug: string } | null
  craft: string | null
  score: number
  matchedConstraints: string[]
  whyRecommended: string
}

interface Message {
  role: 'user' | 'ai'
  text: string
  sources?: string[]
  products?: ChatProduct[]
  debug?: DebugInfo
}

export default function ChatWidget() {
  // 'chatbot' namespace isn't added to the shared registry.ts yet (out of scope for
  // this workstream), so we read the dictionary directly here using the same
  // lang-with-fallback-to-en logic as useTranslation. Swap to
  // `useTranslation('chatbot')` once registry.ts registers this namespace.
  const { lang } = useLanguage()
  const t = (key: keyof typeof chatbotDict.en): string => chatbotDict[lang]?.[key] ?? chatbotDict.en[key]

  const SUGGESTED = [
    t('suggestedQ1'),
    t('suggestedQ2'),
    t('suggestedQ3'),
    t('suggestedQ4'),
  ]

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Debug mode is opt-in via ?debug=1 AND still gated server-side to admins
  // only — a non-admin visiting this URL gets no debug data back. Read
  // lazily (not in an effect) since it never affects rendered markup, only
  // a later fetch payload, so there's no hydration-mismatch concern.
  const [debugRequested] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1')
  const [debugOpenFor, setDebugOpenFor] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Multi-turn memory: the last resolved structured query is kept
  // client-side and round-tripped so follow-ups like "under ₹3000" inherit
  // prior entities (craft, state, ...) without the user repeating them.
  const structuredQueryRef = useRef<StructuredQuery | null>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'ai', text: `Namaste! 🌾 ${t('greetingBody')}` }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')

    // Snapshot history before adding the new user message (exclude the initial greeting)
    const historySnapshot = messages.filter(m => !(m.role === 'ai' && m.text.startsWith('Namaste!')))

    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          history: historySnapshot,
          previousQuery: structuredQueryRef.current,
          debug: debugRequested,
        }),
      })
      const data = await res.json()
      structuredQueryRef.current = data.structuredQuery ?? null
      setMessages(m => [...m, {
        role: 'ai',
        text: data.answer || t('noAnswer'),
        sources: data.sources,
        products: data.products,
        debug: data.debug,
      }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: t('connectErrorShort') }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="chat-panel" style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 1000,
          width: 360, height: 520,
          background: '#FFFFFF', border: '1.5px solid #DDB840',
          borderRadius: 16, boxShadow: '0 16px 60px rgba(26,10,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatSlideUp 0.22s ease',
        }}>
          {/* Header */}
          <div style={{ background: '#1B2E4A', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #E8380A, #D4A000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
              🌾
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter', sans-serif" }}>KalaStree AI</div>
              <div style={{ fontSize: '0.68rem', color: '#4CAF50', fontWeight: 700, letterSpacing: '0.05em' }}>● {t('giResearchAssistant')}</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user' ? '#E8380A' : '#FFE8A8',
                  color: msg.role === 'user' ? '#fff' : '#1B2E4A',
                  fontSize: '0.85rem', lineHeight: 1.55, fontFamily: "'Inter', sans-serif",
                }} className="chat-bubble">
                  {msg.role === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ fontSize: '0.68rem', color: '#A07840', marginTop: 3, paddingLeft: 4 }}>
                    <span style={{ color: '#D4A000', fontWeight: 700 }}>{t('sourcesLabel')}</span> {msg.sources.join(', ')}
                  </div>
                )}

                {msg.products && msg.products.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, width: '100%' }}>
                    {msg.products.map(p => (
                      <Link key={p.id} href={`/shop/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                          display: 'flex', gap: 10, padding: 8, background: '#fff',
                          border: '1px solid #EDD060', borderRadius: 12, cursor: 'pointer',
                        }}>
                          <div style={{
                            position: 'relative', width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                            background: '#FFE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {p.image
                              ? <Image src={p.image} alt={p.name} fill sizes="52px" style={{ objectFit: 'cover' }} />
                              : <span style={{ fontSize: '1.3rem' }}>🎁</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1B2E4A', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#6B4820', marginTop: 1 }}>
                              ₹{p.price.toLocaleString('en-IN')} {p.artisan && `· ${p.artisan.name}`}
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                              {p.giVerified && (
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff', background: '#1A7A32', borderRadius: 4, padding: '1px 6px' }}>
                                  GI Verified
                                </span>
                              )}
                              {p.state && (
                                <span style={{ fontSize: '0.6rem', color: '#A07840' }}>{p.state}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {msg.debug && (
                  <div style={{ marginTop: 6, width: '100%' }}>
                    <button
                      onClick={() => setDebugOpenFor(debugOpenFor === i ? null : i)}
                      style={{ fontSize: '0.65rem', color: '#A07840', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                      {debugOpenFor === i ? 'Hide' : 'Show'} pipeline debug info
                    </button>
                    {debugOpenFor === i && (
                      <pre style={{
                        fontSize: '0.62rem', background: '#1B2E4A', color: '#D4E0FF', padding: 8, borderRadius: 8,
                        marginTop: 4, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {JSON.stringify(msg.debug, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: '#FFE8A8', padding: '10px 14px', borderRadius: '14px 14px 14px 2px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A000', display: 'block', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions — only when just the greeting is shown */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus() }}
                    style={{ background: '#fff', border: '1px solid #DDB840', borderRadius: 14, padding: '5px 11px', fontSize: '0.75rem', color: '#6B4820', cursor: 'pointer', fontFamily: "'Inter', sans-serif", textAlign: 'left', lineHeight: 1.3 }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #EDD060', padding: '10px 12px', background: '#FFFFFF', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={t('askPlaceholderShort')}
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1.5px solid #DDB840', borderRadius: 10,
                  padding: '9px 12px', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                  background: '#FFF8EE', outline: 'none', color: '#1B2E4A', lineHeight: 1.4,
                  maxHeight: 80, overflowY: 'auto',
                }}
              />
              <button onClick={send} disabled={loading || !input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: loading || !input.trim() ? '#DDB840' : '#E8380A',
                  color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  transition: 'background 0.2s',
                }}>
                ↑
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#C0A050', marginTop: 6, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
              {t('poweredByLabel')} GPT-4o Mini · KalaStree PhD Research
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(v => !v)}
        aria-label={t('openChatbotAria')}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: open ? '#1B2E4A' : 'linear-gradient(135deg, #E8380A 0%, #D4A000 100%)',
          color: '#fff', cursor: 'pointer', fontSize: '1.4rem',
          boxShadow: '0 4px 20px rgba(232,56,10,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s, transform 0.2s',
          transform: open ? 'rotate(0deg)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        {open ? '✕' : '🤖'}
      </button>

      <style>{`
        @keyframes chatSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @media(max-width:480px){
          .chat-panel { width:92vw !important; right:4vw !important; bottom:76px !important; height:70vh !important; }
          .chat-fab { bottom:12px !important; right:12px !important; width:48px !important; height:48px !important; }
        }
      `}</style>
    </>
  )
}
