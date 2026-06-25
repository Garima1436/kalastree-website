'use client'
import { useState } from 'react'

export default function ChatbotPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer('')
    setSources([])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      setAnswer(data.answer || 'No answer returned.')
      setSources(data.sources || [])
    } catch {
      setAnswer('Unable to connect to the AI assistant. Please try again.')
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
            Live · Powered by Gemini 2.5 Flash + RAG
          </div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1rem' }}>
            KalaStree <span style={{ color: '#C94B1A' }}>GI Research</span> AI Chatbot
          </h1>
          <p style={{ color: '#5C5542', fontSize: '1rem', lineHeight: 1.8 }}>
            A domain-specific RAG assistant trained on Garima's PhD research. Ask anything about GI products, women's FinTech adoption, empowerment indices, or policy recommendations — and get cited, grounded answers.
          </p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#5C5542' }}>
            <strong>Built with:</strong> Gemini 2.5 Flash · ChromaDB · LangChain · RAG · Grounded answers
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
          </div>

          {/* Answer area */}
          {(answer || loading) && (
            <div style={{ marginBottom: '1rem' }}>
              {loading ? (
                <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#B8860B', display: 'inline-block', animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: '10px 10px 10px 2px', padding: '12px 16px', fontSize: '0.9rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', marginBottom: sources.length > 0 ? '0.75rem' : 0 }}>
                    {answer}
                  </div>
                  {sources.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', paddingLeft: 4 }}>
                      <strong style={{ color: '#B8860B' }}>Sources:</strong> {sources.join(', ')}
                    </div>
                  )}
                </>
              )}
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
            onClick={ask}
            disabled={loading || !question.trim()}
            style={{ width: '100%', padding: '12px', background: loading ? '#555' : '#C94B1A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Thinking...' : 'Ask KalaStree AI'}
          </button>
        </div>

        {/* Sample questions */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C5542', marginBottom: '1rem' }}>Try asking:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'What is the FinTech adoption index for GI workers?',
              'Which state has the most GI-tagged products?',
              'What are the main barriers women face in digital payments?',
              'Tell me about Madhubani painting as a GI product',
              'How does Pashmina weaving empower women in Kashmir?',
              'What is the Women Empowerment Index in the research?',
            ].map(q => (
              <button key={q} onClick={() => { setQuestion(q); }} style={{ background: '#F2E8D5', border: '1px solid #D9C9A8', borderRadius: 20, padding: '6px 14px', fontSize: '0.8rem', color: '#5C5542', cursor: 'pointer', fontFamily: "'Lato', sans-serif", textAlign: 'left' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
        textarea::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>
    </div>
  )
}
