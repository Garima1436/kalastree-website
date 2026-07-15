'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { friendlyAuthError } from '@/lib/auth-errors'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

function ResetPasswordForm() {
  const { t } = useTranslation('auth')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session))
  }, [])

  const validate = () => {
    const errs: { password?: string; confirmPassword?: string } = {}
    if (!password) errs.password = t('passwordRequired')
    else if (password.length < 8) errs.password = t('passwordMinLength')
    if (confirmPassword !== password) errs.confirmPassword = t('passwordsDoNotMatch')
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(friendlyAuthError(error.message)); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
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
  const fieldErrorStyle: React.CSSProperties = { color: '#B91C1C', fontSize: '0.78rem', marginTop: 4 }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.4rem' }}>
            {t('setNewPassword')}
          </h1>
          <p style={{ color: '#6B4820', fontSize: '0.9rem' }}>{t('setNewPasswordSubtitle')}</p>
        </div>

        {hasSession === false ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '14px 16px', color: '#B91C1C', fontSize: '0.85rem', textAlign: 'center' }}>
            {t('invalidResetLink')}{' '}
            <Link href="/forgot-password" style={{ color: '#B91C1C', fontWeight: 700 }}>{t('requestNewOne')}</Link>
          </div>
        ) : done ? (
          <div style={{ background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 6, padding: '14px 16px', color: '#166534', fontSize: '0.88rem', textAlign: 'center' }}>
            {t('passwordUpdatedMessage')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            <div>
              <label style={labelStyle}>{t('newPasswordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} disabled={loading}
                  onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: undefined })) }}
                  style={{ ...(fieldErrors.password ? inputErrorStyle : inputStyle), paddingRight: 46 }} placeholder={t('placeholderMinPassword8')} />
                <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? t('hidePasswordAria') : t('showPasswordAria')}
                  style={{
                    position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px',
                    fontSize: '0.78rem', fontWeight: 700, color: '#6B4820',
                  }}>
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </div>
              {fieldErrors.password && <p style={fieldErrorStyle}>{fieldErrors.password}</p>}
            </div>
            <div>
              <label style={labelStyle}>{t('confirmPasswordLabel')}</label>
              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} disabled={loading}
                onChange={e => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors(f => ({ ...f, confirmPassword: undefined })) }}
                style={fieldErrors.confirmPassword ? inputErrorStyle : inputStyle} placeholder={t('placeholderReenterPassword')} />
              {fieldErrors.confirmPassword && <p style={fieldErrorStyle}>{fieldErrors.confirmPassword}</p>}
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#E8380A', color: '#fff', padding: '13px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
            }}>
              {loading ? t('updating') : t('updatePasswordButton')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>
}
