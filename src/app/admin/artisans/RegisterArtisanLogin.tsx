'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function RegisterArtisanLogin({ artisanId, artisanName }: { artisanId: string; artisanName: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const { t } = useTranslation('adminArtisans')
  const { t: tc } = useTranslation('common')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/register-artisan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artisanId, email, password, fullName: artisanName }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { alert(t('errorPrefix') + (data.error ?? t('failed'))); return }
    setDone(true)
    router.refresh()
  }

  if (done) return <span style={{ fontSize: '0.75rem', color: '#1A7A32', fontWeight: 700 }}>{t('loginCreated')}</span>

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 4,
      background: '#1A7A32', color: '#fff', border: 'none', cursor: 'pointer',
    }}>
      {t('registerLoginButton')}
    </button>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 380, border: '1.5px solid #DDB840' }}>
        <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', color: '#1B2E4A', margin: '0 0 0.5rem' }}>
          {t('modalTitle').replace('{name}', artisanName)}
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#6B4820', marginBottom: '1.5rem' }}>
          {t('modalDesc')}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B4820', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('emailLabel')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '0.92rem', background: '#FFF8EE', boxSizing: 'border-box' }}
              placeholder={t('emailPlaceholder')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B4820', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('passwordLabel')}</label>
            <input type="text" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '0.92rem', background: '#FFF8EE', boxSizing: 'border-box' }}
              placeholder={t('passwordPlaceholder')} />
            <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>{t('passwordNote')}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, background: '#1A7A32', color: '#fff', padding: '11px', border: 'none',
              borderRadius: 6, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? t('creating') : t('createLogin')}
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{
              padding: '11px 16px', background: 'none', border: '1.5px solid #DDB840',
              borderRadius: 6, fontWeight: 700, cursor: 'pointer', color: '#6B4820',
            }}>
              {tc('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
