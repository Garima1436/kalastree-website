'use client'
import { useState } from 'react'

interface Props {
  label: string
  sourceText: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  translateLabel: string
  translatingLabel: string
  hint?: string
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
}

export default function TranslateHindiField({
  label, sourceText, value, onChange, multiline, translateLabel, translatingLabel, hint, inputStyle, labelStyle,
}: Props) {
  const [translating, setTranslating] = useState(false)
  const [err, setErr] = useState('')

  const handleTranslate = async () => {
    if (!sourceText.trim() || translating) return
    setTranslating(true)
    setErr('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, target: 'hi' }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Translation failed'); return }
      onChange(data.translated)
    } catch {
      setErr('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={labelStyle}>{label}</label>
        <button
          type="button"
          onClick={handleTranslate}
          disabled={translating || !sourceText.trim()}
          style={{
            fontSize: '0.7rem', fontWeight: 700, color: '#1A7A32', background: 'none', border: 'none',
            cursor: sourceText.trim() ? 'pointer' : 'not-allowed', opacity: sourceText.trim() ? 1 : 0.5, padding: 0,
          }}
        >
          {translating ? translatingLabel : `🌐 ${translateLabel}`}
        </button>
      </div>
      {multiline ? (
        <textarea
          style={{ ...inputStyle, minHeight: 90, resize: 'vertical' } as React.CSSProperties}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          style={inputStyle}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {hint && <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>{hint}</p>}
      {err && <p style={{ fontSize: '0.72rem', color: '#E8380A', marginTop: 4 }}>{err}</p>}
    </div>
  )
}
