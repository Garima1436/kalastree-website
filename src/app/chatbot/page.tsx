'use client'
import { useState } from 'react'

interface Turn {
  role: 'user' | 'ai'
  text: string
  sources?: string[]
}

const SAMPLE_QUESTIONS = [
  'What is the FinTech adoption index for GI workers?',
  'Which state has the most GI-tagged products?',
  'What are the main barriers women face in digital payments?',
  'Tell me about Madhubani painting as a GI product',
  'How does Pashmina weaving empower women in Kashmir?',
  'What is the Women Empowerment Index in the research?',
]

export default function ChatbotPage() {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<Turn[]>([])
  const [loading, setLoading] = useState(false)

  const ask = async (q?: string) => {
    const text = (q ?? question).trim()
    if (!text || loading) return
    setQuestion('')

    // Snapshot history before this turn
    const historySnapshot = history

    setHistory(h => [...h, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, history: historySnapshot }),
      })
      const data = await res.json()
      setHistory(h => [...h, { role: 'ai', text: data.answer || 'No answer returned.', sources: data.sources }])
    } catch {
      setHistory(h => [...h, { role: 'ai', text: 'Unable to connect to the AI assistant. Please try again.' }])
    }

    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#F5E8E0', padding: '3.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cg stroke='%23C94B1A' stroke-width='0.5' opacity='0.08' fill='none'%3E%3Cpolygon points='50,5 95,27 95,73 50,95 5,73 5,27'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1B2E4A', color: '#B8860B', padding: '6px 16px', borderRadius: 30, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', animation: 'pulse 1.5s ease-in-out infinite' }} />
            Live · Powered by GPT-4o Mini + RAG
          </div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1rem' }}>
            KalaStree <span style={{ color: '#C94B1A' }}>GI Research</span> AI Chatbot
          </h1>
          <p style={{ color: '#5C5542', fontSize: '1rem', lineHeight: 1.8 }}>
            A domain-specific RAG assistant trained on Garima&apos;s PhD research. Ask anything about GI products, women&apos;s FinTech adoption, empowerment indices, or policy recommendations — and get cited, grounded answers.
          </p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#5C5542' }}>
            <strong>Built with:</strong> GPT-4o Mini · ChromaDB · LangChain · RAG · Grounded answers
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 5%' }}>
        <div style={{ background: '#1B2E4A', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(184,134,11,0.2)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C94B1A, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🌾</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>KalaStree AI</div>
              <div style={{ fontSize: '0.7rem', color: '#4CAF50', fontWeight: 700, letterSpacing: '0.06em' }}>● Online</div>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Clear chat
              </button>
            )}
          </div>

          {/* Conversation history */}
          {history.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((turn, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: turn.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px',
                    borderRadius: turn.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: turn.role === 'user' ? '#C94B1A' : 'rgba(255,255,255,0.08)',
                    border: turn.role === 'ai' ? '1px solid rgba(184,134,11,0.2)' : 'none',
                    fontSize: '0.9rem', lineHeight: 1.7,
                    color: 'rgba(255,255,255,0.9)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {turn.text}
                  </div>
                  {turn.sources && turn.sources.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 3, paddingLeft: 4 }}>
                      <strong style={{ color: '#B8860B' }}>Sources:</strong> {turn.sources.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Loading dots */}
          {loading && (
            <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center', marginBottom: '1rem' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#B8860B', display: 'inline-block', animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}

          {/* Input */}
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
            placeholder="Ask about GI products, women's FinTech adoption, empowerment data, state-wise analysis..."
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,134,11,0.25)', borderRadius: 8, padding: '12px 16px', fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', color: '#fff', outline: 'none', resize: 'none', marginBottom: '0.75rem' }}
          />
          <button
            onClick={() => ask()}
            disabled={loading || !question.trim()}
            style={{ width: '100%', padding: '12px', background: loading ? '#555' : '#C94B1A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Thinking...' : 'Ask KalaStree AI'}
          </button>
        </div>

        {/* Sample questions — only shown before any conversation starts */}
        {history.length === 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C5542', marginBottom: '1rem' }}>Try asking:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SAMPLE_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  style={{ background: '#F2E8D5', border: '1px solid #D9C9A8', borderRadius: 20, padding: '6px 14px', fontSize: '0.8rem', color: '#5C5542', cursor: 'pointer', fontFamily: "'Lato', sans-serif", textAlign: 'left' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
        textarea::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>
    </div>
  )
}
