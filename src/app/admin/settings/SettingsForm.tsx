'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_MESSAGE_PLACEHOLDER = 'Hi KalaStree team, I have a query about your GI-verified products/artisans.'

interface Props {
  initialWhatsappNumber: string
  initialWhatsappMessage: string
}

export default function SettingsForm({ initialWhatsappNumber, initialWhatsappMessage }: Props) {
  const router = useRouter()
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber)
  const [whatsappMessage, setWhatsappMessage] = useState(initialWhatsappMessage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840',
    borderRadius: 6, fontSize: '0.92rem', background: '#FFF8EE', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 5,
  }

  const saveSetting = async (key: string, value: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: value.trim() || null }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error ?? 'Failed to save')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      await saveSetting('whatsapp_number', whatsappNumber)
      await saveSetting('whatsapp_default_message', whatsappMessage)
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', maxWidth: 500 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        {saved && !error && (
          <div style={{ background: '#DCFCE7', border: '1px solid #22C55E', borderRadius: 6, padding: '10px 14px', color: '#15803D', fontSize: '0.85rem' }}>
            Saved.
          </div>
        )}

        <div>
          <label style={labelStyle}>WhatsApp Number</label>
          <input
            style={inputStyle}
            value={whatsappNumber}
            onChange={e => { setWhatsappNumber(e.target.value); setSaved(false) }}
            placeholder="+91XXXXXXXXXX"
          />
          <div style={{ fontSize: '0.75rem', color: '#A07840', marginTop: 6 }}>
            Include the country code (e.g. +91XXXXXXXXXX). Used for the floating WhatsApp button shown on every page. Leave empty to hide the button.
          </div>
        </div>
        <div>
          <label style={labelStyle}>Default Message</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' } as React.CSSProperties}
            value={whatsappMessage}
            onChange={e => { setWhatsappMessage(e.target.value); setSaved(false) }}
            placeholder={DEFAULT_MESSAGE_PLACEHOLDER}
          />
          <div style={{ fontSize: '0.75rem', color: '#A07840', marginTop: 6 }}>
            Pre-fills the WhatsApp chat when someone taps the button. Leave empty to use the default: &ldquo;{DEFAULT_MESSAGE_PLACEHOLDER}&rdquo;
          </div>
        </div>

        <div>
          <button type="submit" disabled={loading} style={{
            background: '#E8380A', color: '#fff', padding: '12px 28px',
            border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
