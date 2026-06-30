'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = redirect
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #DDB840', borderRadius: 6,
    fontSize: '0.95rem', background: '#FFF8EE', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.4rem' }}>
            Create Account
          </h1>
          <p style={{ color: '#6B4820', fontSize: '0.9rem' }}>Join KalaStree and support women artisans</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              required style={inputStyle} placeholder="Priya Sharma" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required style={inputStyle} placeholder="you@email.com" />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6} style={inputStyle} placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', background: '#E8380A', color: '#fff', padding: '13px',
            border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
          }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6B4820' }}>
          Already have an account?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} style={{ color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>
}
