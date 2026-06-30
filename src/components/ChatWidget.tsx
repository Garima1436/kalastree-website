'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'ai'
  text: string
  sources?: string[]
}

const SUGGESTED = [
  'Which state has most GI products?',
  'How does Pashmina empower women?',
  'What is the FinTech adoption index?',
  'Tell me about Madhubani painting',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'ai', text: 'Namaste! 🌾 I\'m KalaStree AI, trained on GI research data. Ask me anything about Indian GI products, women artisans, or FinTech adoption.' }])
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
        body: JSON.stringify({ question: q, history: historySnapshot }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'ai', text: data.answer || 'No answer returned.', sources: data.sources }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Unable to connect. Please try again.' }])
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
          background: '#FFFEF9', border: '1.5px solid #D9C9A8',
          borderRadius: 16, boxShadow: '0 16px 60px rgba(26,10,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatSlideUp 0.22s ease',
        }}>
          {/* Header */}
          <div style={{ background: '#1B2E4A', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C94B1A, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
              🌾
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', fontFamily: "'Lato', sans-serif" }}>KalaStree AI</div>
              <div style={{ fontSize: '0.68rem', color: '#4CAF50', fontWeight: 700, letterSpacing: '0.05em' }}>● GI Research Assistant</div>
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
                  background: msg.role === 'user' ? '#C94B1A' : '#F2E8D5',
                  color: msg.role === 'user' ? '#fff' : '#1B2E4A',
                  fontSize: '0.85rem', lineHeight: 1.55, fontFamily: "'Lato', sans-serif",
                }}>
                  {msg.text}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ fontSize: '0.68rem', color: '#9A8E7A', marginTop: 3, paddingLeft: 4 }}>
                    <span style={{ color: '#B8860B', fontWeight: 700 }}>Sources:</span> {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: '#F2E8D5', padding: '10px 14px', borderRadius: '14px 14px 14px 2px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#B8860B', display: 'block', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions — only when just the greeting is shown */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus() }}
                    style={{ background: '#fff', border: '1px solid #D9C9A8', borderRadius: 14, padding: '5px 11px', fontSize: '0.75rem', color: '#5C5542', cursor: 'pointer', fontFamily: "'Lato', sans-serif", textAlign: 'left', lineHeight: 1.3 }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #EDE0C8', padding: '10px 12px', background: '#FFFEF9', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about GI products…"
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1.5px solid #D9C9A8', borderRadius: 10,
                  padding: '9px 12px', fontFamily: "'Lato', sans-serif", fontSize: '0.85rem',
                  background: '#FDF6E3', outline: 'none', color: '#1B2E4A', lineHeight: 1.4,
                  maxHeight: 80, overflowY: 'auto',
                }}
              />
              <button onClick={send} disabled={loading || !input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: loading || !input.trim() ? '#D9C9A8' : '#C94B1A',
                  color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  transition: 'background 0.2s',
                }}>
                ↑
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#B8B0A0', marginTop: 6, textAlign: 'center', fontFamily: "'Lato', sans-serif" }}>
              Powered by Gemini 2.5 Flash · KalaStree PhD Research
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(v => !v)}
        aria-label="Open AI Chatbot"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: open ? '#1B2E4A' : 'linear-gradient(135deg, #C94B1A 0%, #B8860B 100%)',
          color: '#fff', cursor: 'pointer', fontSize: '1.4rem',
          boxShadow: '0 4px 20px rgba(201,75,26,0.4)',
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
