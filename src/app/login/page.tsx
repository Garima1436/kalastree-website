'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      const userId = data.user?.id
      if (userId) {
        const userCartKey = `kalastree_cart_${userId}`
        const savedCart = localStorage.getItem(userCartKey)
        if (savedCart) {
          // Restore this user's own cart from backup
          localStorage.setItem('kalastree_cart', savedCart)
          localStorage.removeItem(userCartKey)
        } else {
          // No backup — start fresh (clear any other user's leftover cart)
          localStorage.removeItem('kalastree_cart')
        }
        localStorage.setItem('kalastree_cart_owner', userId)
        window.dispatchEvent(new Event('cart_updated'))
      }
      router.push(redirect)
      router.refresh()
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #D9C9A8', borderRadius: 6,
    fontSize: '0.95rem', background: '#FDF6E3', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.4rem' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#5C5542', fontSize: '0.9rem' }}>Sign in to your KalaStree account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required style={inputStyle} placeholder="you@email.com" />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required style={inputStyle} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#C94B1A', color: '#fff', padding: '13px',
            border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
          }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#5C5542' }}>
          No account?{' '}
          <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} style={{ color: '#C94B1A', fontWeight: 700, textDecoration: 'none' }}>
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
