'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const { t: tc } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError('')

    const trimmed = email.trim()
    if (!trimmed) { setFieldError(t('emailRequired')); return }
    if (!EMAIL_RE.test(trimmed)) { setFieldError(t('emailInvalid')); return }

    setLoading(true)
    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
    })
    setLoading(false)
    // Always show the same success state, even on failure, so we don't leak
    // whether an email address has an account (standard password-reset practice).
    if (error) console.error('resetPasswordForEmail error:', error.message)
    setSent(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #DDB840', borderRadius: 6,
    fontSize: '0.95rem', background: '#FFF8EE', outline: 'none',
  }
  const inputErrorStyle: React.CSSProperties = { ...inputStyle, borderColor: '#EF4444' }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.4rem' }}>
            {t('resetPasswordHeading')}
          </h1>
          <p style={{ color: '#6B4820', fontSize: '0.9rem' }}>
            {sent ? t('resetSentMessage') : t('resetInstructions')}
          </p>
        </div>

        {sent ? (
          <div style={{ background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 6, padding: '14px 16px', color: '#166534', fontSize: '0.88rem', textAlign: 'center' }}>
            {t('checkInboxMessage')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
            <div>
              <label style={labelStyle}>{tc('email')}</label>
              <input type="email" value={email} disabled={loading}
                onChange={e => { setEmail(e.target.value); if (fieldError) setFieldError('') }}
                style={fieldError ? inputErrorStyle : inputStyle} placeholder={t('placeholderEmail')} />
              {fieldError && <p style={{ color: '#B91C1C', fontSize: '0.78rem', marginTop: 4 }}>{fieldError}</p>}
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#E8380A', color: '#fff', padding: '13px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
            }}>
              {loading ? t('sending') : t('sendResetLinkButton')}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6B4820' }}>
          <Link href="/login" style={{ color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
            {t('backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
