'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import chatbotDict from '@/lib/i18n/dictionaries/chatbot'
import type { StructuredQuery, Evidence, DebugInfo } from '@/lib/intelligence/types'

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

// Strips common Markdown syntax before sending text to TTS — otherwise it
// reads punctuation like "**" and "#" out loud instead of just the words.
// Deliberately simple (regex-based, not a full parser): good enough for the
// bold/italic/heading/list/link shapes the LLM's answers actually use.
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [label](url) -> label
    .replace(/[*_#>`]+/g, '') // bold/italic/heading/quote/code markers
    .replace(/^\s*[-•]\s+/gm, '') // bullet markers
    .replace(/\n{2,}/g, '. ') // paragraph breaks -> pause
    .replace(/\n/g, ' ')
    .trim()
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
  // Same pattern, for the last answer's evidence — lets a follow-up like
  // "where did you get that?" be answered from what was actually used,
  // instead of a fresh, unrelated search.
  const previousEvidenceRef = useRef<Evidence[] | null>(null)

  // Voice input/output. Deliberately wraps the EXISTING text pipeline
  // (record -> transcribe -> send() exactly like a typed message -> answer
  // text -> speak) rather than any direct speech-to-speech model, so voice
  // questions still go through the full deterministic pipeline (GI
  // verification, eligibility, etc.) — nothing about /api/chat changes.
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [micSupported] = useState(() =>
    typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
  )
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'ai', text: `Namaste! 🌾 ${t('greetingBody')}` }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // overrideText/opts let voice input feed a transcribed question through
  // this exact same path a typed message takes — the deterministic pipeline
  // behind /api/chat never knows or cares whether the question was typed or
  // spoken.
  const send = async (overrideText?: string, opts?: { viaVoice?: boolean }) => {
    const q = (overrideText ?? input).trim()
    if (!q || loading) return
    if (overrideText === undefined) setInput('')

    // Snapshot history before adding the new user message (exclude the initial greeting)
    const historySnapshot = messages.filter(m => !(m.role === 'ai' && m.text.startsWith('Namaste!')))
    const aiMessageIndex = messages.length + 1 // user goes at messages.length, AI right after

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
          previousEvidence: previousEvidenceRef.current,
          debug: debugRequested,
        }),
      })
      const data = await res.json()
      structuredQueryRef.current = data.structuredQuery ?? null
      previousEvidenceRef.current = data.evidence ?? null
      const answerText = data.answer || t('noAnswer')
      setMessages(m => [...m, {
        role: 'ai',
        text: answerText,
        sources: data.sources,
        products: data.products,
        debug: data.debug,
      }])
      // A question asked by voice gets its answer read back automatically —
      // closes the speech-to-speech loop. A typed question never
      // auto-plays (each AI message also has a manual "listen" button).
      if (opts?.viaVoice) playAnswer(answerText, aiMessageIndex)
    } catch {
      setMessages(m => [...m, { role: 'ai', text: t('connectErrorShort') }])
    }
    setLoading(false)
  }

  const playAnswer = async (text: string, index: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      audioPlayerRef.current = null
    }
    if (playingIndex === index) { setPlayingIndex(null); return } // clicking again stops it

    const plain = stripMarkdownForSpeech(text)
    if (!plain) return
    setPlayingIndex(index)
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plain }),
      })
      if (!res.ok) throw new Error('tts request failed')
      const url = URL.createObjectURL(await res.blob())
      const audio = new Audio(url)
      audioPlayerRef.current = audio
      audio.onended = () => { setPlayingIndex(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayingIndex(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch {
      setPlayingIndex(null)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        transcribeAndSend(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setMessages(m => [...m, { role: 'ai', text: t('micPermissionError') }])
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const transcribeAndSend = async (blob: Blob) => {
    setTranscribing(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'speech.webm')
      const res = await fetch('/api/speech-to-text', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.text) {
        setMessages(m => [...m, { role: 'ai', text: t('voiceTranscribeError') }])
      } else {
        await send(data.text, { viaVoice: true })
      }
    } catch {
      setMessages(m => [...m, { role: 'ai', text: t('voiceTranscribeError') }])
    }
    setTranscribing(false)
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
                {msg.role === 'ai' && (
                  <button
                    onClick={() => playAnswer(msg.text, i)}
                    aria-label={playingIndex === i ? t('stopListenAria') : t('listenAria')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px 0',
                      color: playingIndex === i ? '#E8380A' : '#C0A050', fontSize: '0.72rem',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    {playingIndex === i ? '⏸' : '🔊'}
                  </button>
                )}
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
                placeholder={recording ? t('listeningLabel') : transcribing ? t('transcribingLabel') : t('askPlaceholderShort')}
                disabled={recording || transcribing}
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1.5px solid #DDB840', borderRadius: 10,
                  padding: '9px 12px', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                  background: recording || transcribing ? '#FFF3D6' : '#FFF8EE', outline: 'none', color: '#1B2E4A', lineHeight: 1.4,
                  maxHeight: 80, overflowY: 'auto',
                }}
              />
              {micSupported && (
                <button
                  onClick={() => (recording ? stopRecording() : startRecording())}
                  disabled={loading || transcribing}
                  aria-label={recording ? t('micAriaStop') : t('micAriaStart')}
                  className={recording ? 'mic-recording' : undefined}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                    background: recording ? '#E8380A' : '#FFE8A8',
                    color: recording ? '#fff' : '#1B2E4A',
                    cursor: loading || transcribing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                    transition: 'background 0.2s', opacity: transcribing ? 0.6 : 1,
                  }}>
                  🎙
                </button>
              )}
              <button onClick={() => send()} disabled={loading || !input.trim() || recording || transcribing}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: loading || !input.trim() || recording || transcribing ? '#DDB840' : '#E8380A',
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
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(232,56,10,0.45)} 50%{box-shadow:0 0 0 8px rgba(232,56,10,0)} }
        .mic-recording { animation: micPulse 1.4s ease-in-out infinite; }
        @media(max-width:480px){
          .chat-panel { width:92vw !important; right:4vw !important; bottom:76px !important; height:70vh !important; }
          .chat-fab { bottom:12px !important; right:12px !important; width:48px !important; height:48px !important; }
        }
      `}</style>
    </>
  )
}
