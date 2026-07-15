'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { INDIAN_STATES } from '@/lib/indian-states'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function ProfilePage() {
  const { t } = useTranslation('shopping')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/login?redirect=/account/profile'); return }
      setUser(session.user)
      const res = await fetch('/api/profile')
      const { profile } = await res.json()
      if (profile) {
        setForm({
          full_name: profile.full_name || session.user.user_metadata?.full_name || '',
          phone: profile.phone || '',
          address_line: profile.address_line || '',
          city: profile.city || '',
          state: profile.state || '',
          pincode: profile.pincode || '',
        })
      }
      setLoading(false)
    })
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment)' }}>
      <div style={{ color: '#6B4820', fontFamily: "'Lato', sans-serif" }}>{t('loadingProfile')}</div>
    </div>
  )

  const initials = (form.full_name || user?.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)', padding: '3rem 5%' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #E8380A, #D4A000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: '#1B2E4A', margin: 0 }}>
              {form.full_name || t('yourProfileFallback')}
            </h1>
            <p style={{ color: '#6B4820', fontSize: '0.9rem', margin: '4px 0 0' }}>{user?.email}</p>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: `📦 ${tc('myOrders')}`, href: '/account/orders' },
            { label: `🛒 ${t('continueShopping')}`, href: '/shop' },
          ].map(({ label, href }) => (
            <a key={href} href={href} style={{ padding: '8px 18px', background: '#FFE8A8', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '0.85rem', fontWeight: 700, color: '#1B2E4A', textDecoration: 'none', fontFamily: "'Lato', sans-serif" }}>
              {label}
            </a>
          ))}
        </div>

        <form onSubmit={handleSave} style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, overflow: 'hidden' }}>

          {/* Personal Info */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #EDD060' }}>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '1.25rem' }}>
              {t('personalInformation')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('fullName')}</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ashish Prasad" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('emailAddressLabel')}</label>
                <input value={user?.email} disabled
                  style={{ ...inputStyle, background: '#FFE8A8', color: '#A07840', cursor: 'not-allowed' }} />
                <span style={{ fontSize: '0.72rem', color: '#A07840' }}>{t('emailCannotBeChanged')}</span>
              </div>
              <div>
                <label style={labelStyle}>{t('phoneNumberLabel')}</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210" type="tel" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.25rem' }}>
              {t('defaultShippingAddress')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#A07840', marginBottom: '1.25rem', fontFamily: "'Lato', sans-serif" }}>
              {t('autoFilledAtCheckout')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('addressLineLabel')}</label>
                <input value={form.address_line} onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))}
                  placeholder={t('addressPlaceholder')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('cityLabel')}</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Patna" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('stateLabel')}</label>
                <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={inputStyle}>
                  <option value="">{t('selectStateOption')}</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('pincodeLabel')}</label>
                <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                  placeholder="800001" maxLength={6} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Save */}
          <div style={{ padding: '1.25rem 1.5rem', background: '#FFF5E0', borderTop: '1px solid #EDD060', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" disabled={saving}
              style={{ background: saving ? '#A07840' : '#E8380A', color: '#fff', padding: '11px 28px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Lato', sans-serif", transition: 'background 0.2s' }}>
              {saving ? t('savingLabel') : t('saveChanges')}
            </button>
            {saved && (
              <span style={{ color: '#1A7A32', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Lato', sans-serif" }}>
                ✓ {t('profileUpdatedSuccess')}
              </span>
            )}
          </div>
        </form>

      </div>

      <style>{`
        @media(max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="gridColumn: '1 / -1'"] { grid-column: 1 !important; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Lato', sans-serif", fontSize: '0.78rem',
  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#6B4820', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840',
  borderRadius: 6, fontSize: '0.95rem', fontFamily: "'Lato', sans-serif",
  color: '#1B2E4A', background: '#FFFFFF', boxSizing: 'border-box',
  outline: 'none',
}
