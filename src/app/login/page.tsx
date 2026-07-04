'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { friendlyAuthError, isUnconfirmedEmailError } from '@/lib/auth-errors'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const validate = () => {
    const errs: { email?: string; password?: string } = {}
    if (!email.trim()) errs.email = 'Email is required'
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setResendState('idle')
    if (!validate()) return

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(friendlyAuthError(error.message))
      setShowResend(isUnconfirmedEmailError(error.message))
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      const userCartKey = `kalastree_cart_${userId}`
      const currentOwner = localStorage.getItem('kalastree_cart_owner')
      const savedCart = localStorage.getItem(userCartKey)
      if (savedCart) {
        localStorage.setItem('kalastree_cart', savedCart)
        localStorage.removeItem(userCartKey)
      } else if (currentOwner && currentOwner !== userId) {
        const existing = localStorage.getItem('kalastree_cart')
        if (existing) localStorage.setItem(`kalastree_cart_${currentOwner}`, existing)
        localStorage.removeItem('kalastree_cart')
      }
      localStorage.setItem('kalastree_cart_owner', userId)
      window.dispatchEvent(new Event('cart_updated'))
    }
    window.location.href = redirect
  }

  const handleResend = async () => {
    setResendState('sending')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResendState(error ? 'idle' : 'sent')
    if (error) setError(friendlyAuthError(error.message))
  }

  const handleGoogleLogin = async () => {
    setError('')
    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirect)}` },
    })
    if (error) setError(friendlyAuthError(error.message))
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
            Welcome Back
          </h1>
          <p style={{ color: '#6B4820', fontSize: '0.9rem' }}>Sign in to your KalaStree account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
              {showResend && (
                <div style={{ marginTop: 8 }}>
                  {resendState === 'sent' ? (
                    <span style={{ color: '#166534', fontWeight: 700 }}>✓ Confirmation email sent — check your inbox.</span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={resendState === 'sending'} style={{
                      background: 'none', border: 'none', padding: 0, color: '#B91C1C',
                      fontWeight: 700, textDecoration: 'underline', cursor: resendState === 'sending' ? 'not-allowed' : 'pointer',
                    }}>
                      {resendState === 'sending' ? 'Sending…' : 'Resend confirmation email'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} disabled={loading}
              onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: undefined })) }}
              style={fieldErrors.email ? inputErrorStyle : inputStyle} placeholder="you@email.com" />
            {fieldErrors.email && <p style={fieldErrorStyle}>{fieldErrors.email}</p>}
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} disabled={loading}
                onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: undefined })) }}
                style={{ ...(fieldErrors.password ? inputErrorStyle : inputStyle), paddingRight: 46 }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px',
                  fontSize: '0.78rem', fontWeight: 700, color: '#6B4820',
                }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <p style={fieldErrorStyle}>{fieldErrors.password}</p>}
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#E8380A', color: '#fff', padding: '13px',
            border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
          }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: 1, background: '#DDB840', opacity: 0.4 }} />
          <span style={{ fontSize: '0.75rem', color: '#A07840', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#DDB840', opacity: 0.4 }} />
        </div>

        <button type="button" onClick={handleGoogleLogin} style={{
          width: '100%', background: '#fff', color: '#1B2E4A', padding: '12px',
          border: '1.5px solid #DDB840', borderRadius: 6, fontWeight: 700, fontSize: '0.92rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l6-6C34.6 5.1 29.6 3 24 3 15.8 3 8.7 7.7 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 36.4 27 37 24 37c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C8.7 40.3 15.8 45 24 45z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.5 35.6 45 30.4 45 24c0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6B4820' }}>
          No account?{' '}
          <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} style={{ color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
