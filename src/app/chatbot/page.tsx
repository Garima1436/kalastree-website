'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import chatbotDict from '@/lib/i18n/dictionaries/chatbot'

interface Turn {
  role: 'user' | 'ai'
  text: string
  sources?: string[]
}

export default function ChatbotPage() {
  // 'chatbot' namespace isn't added to the shared registry.ts yet (out of scope for
  // this workstream), so we read the dictionary directly here using the same
  // lang-with-fallback-to-en logic as useTranslation. Swap to
  // `useTranslation('chatbot')` once registry.ts registers this namespace.
  const { lang } = useLanguage()
  const t = (key: keyof typeof chatbotDict.en): string => chatbotDict[lang]?.[key] ?? chatbotDict.en[key]
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<Turn[]>([])
  const [loading, setLoading] = useState(false)

  const SAMPLE_QUESTIONS = [
    t('sampleQ1'),
    t('sampleQ2'),
    t('sampleQ3'),
    t('sampleQ4'),
    t('sampleQ5'),
    t('sampleQ6'),
  ]

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
      setHistory(h => [...h, { role: 'ai', text: data.answer || t('noAnswer'), sources: data.sources }])
    } catch {
      setHistory(h => [...h, { role: 'ai', text: t('connectErrorFull') }])
    }

    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#FFE8DC', padding: '3.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cg stroke='%23C94B1A' stroke-width='0.5' opacity='0.08' fill='none'%3E%3Cpolygon points='50,5 95,27 95,73 50,95 5,73 5,27'/%3E%3Ccircle cx='50' cy='50' r='25'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1B2E4A', color: '#D4A000', padding: '6px 16px', borderRadius: 30, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', animation: 'pulse 1.5s ease-in-out infinite' }} />
            {t('liveLabel')} · {t('poweredByLabel')} GPT-4o Mini + RAG
          </div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1rem' }}>
            KalaStree <span style={{ color: '#E8380A' }}>{t('giResearchHighlight')}</span> {t('aiChatbotSuffix')}
          </h1>
          <p style={{ color: '#6B4820', fontSize: '1rem', lineHeight: 1.8 }}>
            {t('heroDescription')}
          </p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6B4820' }}>
            <strong>{t('builtWithLabel')}</strong> GPT-4o Mini · ChromaDB · LangChain · RAG · {t('groundedAnswers')}
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 5%' }}>
        <div style={{ background: '#1B2E4A', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212,160,0,0.2)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #E8380A, #D4A000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🌾</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>KalaStree AI</div>
              <div style={{ fontSize: '0.7rem', color: '#4CAF50', fontWeight: 700, letterSpacing: '0.06em' }}>● {t('onlineStatus')}</div>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                {t('clearChat')}
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
                    background: turn.role === 'user' ? '#E8380A' : 'rgba(255,255,255,0.08)',
                    border: turn.role === 'ai' ? '1px solid rgba(212,160,0,0.2)' : 'none',
                    fontSize: '0.9rem', lineHeight: 1.7,
                    color: 'rgba(255,255,255,0.9)',
                  }} className="chat-bubble">
                    {turn.role === 'ai' ? <ReactMarkdown>{turn.text}</ReactMarkdown> : turn.text}
                  </div>
                  {turn.sources && turn.sources.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 3, paddingLeft: 4 }}>
                      <strong style={{ color: '#D4A000' }}>{t('sourcesLabel')}</strong> {turn.sources.join(', ')}
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
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A000', display: 'inline-block', animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}

          {/* Input */}
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
            placeholder={t('askPlaceholderFull')}
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,160,0,0.25)', borderRadius: 8, padding: '12px 16px', fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', color: '#fff', outline: 'none', resize: 'none', marginBottom: '0.75rem' }}
          />
          <button
            onClick={() => ask()}
            disabled={loading || !question.trim()}
            style={{ width: '100%', padding: '12px', background: loading ? '#555' : '#E8380A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? t('thinkingLabel') : t('askButton')}
          </button>
        </div>

        {/* Sample questions — only shown before any conversation starts */}
        {history.length === 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginBottom: '1rem' }}>{t('tryAsking')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SAMPLE_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  style={{ background: '#FFE8A8', border: '1px solid #DDB840', borderRadius: 20, padding: '6px 14px', fontSize: '0.8rem', color: '#6B4820', cursor: 'pointer', fontFamily: "'Lato', sans-serif", textAlign: 'left' }}
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
