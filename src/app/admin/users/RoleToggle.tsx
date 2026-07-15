'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INDIAN_STATES } from '@/lib/indian-states'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import dict from '@/lib/i18n/dictionaries/adminUsers'
import commonDict from '@/lib/i18n/dictionaries/common'

const ROLES = ['user', 'artisan', 'admin'] as const
type Role = typeof ROLES[number]

interface Props {
  userId: string
  currentRole: string
  fullName?: string
  state?: string
}

export default function RoleToggle({ userId, currentRole, fullName = '', state = '' }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [artisanForm, setArtisanForm] = useState<{ name: string; state: string; craft: string; gi_product: string } | null>(null)
  const [formError, setFormError] = useState('')
  const router = useRouter()
  const { lang } = useLanguage()
  const t = (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
  const tc = (key: keyof typeof commonDict.en): string => commonDict[lang]?.[key] ?? commonDict.en[key]

  const roleLabel: Record<Role, string> = {
    user: t('roleUserLabel'),
    artisan: t('roleArtisanLabel'),
    admin: t('roleAdminLabel'),
  }
  const roleStyle: Record<Role, { bg: string; color: string; label: string }> = {
    user:    { bg: '#FFE8A8', color: '#6B4820', label: `👤 ${roleLabel.user}` },
    artisan: { bg: '#C8F5D8', color: '#1A7A32', label: `🎨 ${roleLabel.artisan}` },
    admin:   { bg: '#FFF0C0', color: '#D4A000', label: `⚙️ ${roleLabel.admin}` },
  }

  const role = (currentRole as Role) ?? 'user'
  const s = roleStyle[role] ?? roleStyle.user

  const submitRole = async (newRole: Role, artisan?: { name: string; state: string; craft: string; gi_product: string }) => {
    setLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole, artisan }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); alert(t('failedPrefix') + ' ' + (d.error || t('unknownError'))); return }
    router.refresh()
  }

  const setRole = async (newRole: Role) => {
    if (newRole === role) { setOpen(false); return }
    setOpen(false)
    if (newRole === 'artisan') {
      // Making someone an artisan needs a few extra details to create
      // their public artisan profile — collect those before confirming.
      setFormError('')
      setArtisanForm({ name: fullName, state, craft: '', gi_product: '' })
      return
    }
    if (!confirm(t('changeRoleConfirm').replace('{role}', roleLabel[newRole]))) return
    await submitRole(newRole)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1.5px solid #DDB840',
    borderRadius: 6, fontSize: '0.85rem', background: '#FFF8EE', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.68rem', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 4,
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} disabled={loading} style={{
        fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
        border: `1px solid ${s.color}40`, cursor: loading ? 'not-allowed' : 'pointer',
        background: s.bg, color: s.color, opacity: loading ? 0.6 : 1,
      }}>
        {loading ? '…' : s.label + ' ▾'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1.5px solid #DDB840', borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 120, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {ROLES.map(r => {
            const rs = roleStyle[r]
            return (
              <button key={r} onClick={() => setRole(r)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
                background: r === role ? rs.bg : '#fff', color: rs.color,
                border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              }}>
                {rs.label}
              </button>
            )
          })}
        </div>
      )}

      {artisanForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,46,74,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', border: '1.5px solid #DDB840', borderRadius: 12, padding: '1.75rem', width: 380, maxWidth: '90vw' }}>
            <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 700, color: '#1B2E4A', marginTop: 0, marginBottom: 4 }}>
              {t('makeArtisanHeading')}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B4820', marginBottom: '1rem' }}>
              {t('makeArtisanDescription')}
            </p>
            {formError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '8px 12px', color: '#B91C1C', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {formError}
              </div>
            )}
            <form onSubmit={async e => {
              e.preventDefault()
              if (!artisanForm.name || !artisanForm.state || !artisanForm.craft) {
                setFormError(t('nameStateCraftRequired'))
                return
              }
              setArtisanForm(null)
              await submitRole('artisan', artisanForm)
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={labelStyle}>{t('fullNameLabel')}</label>
                <input style={inputStyle} required value={artisanForm.name}
                  onChange={e => setArtisanForm(f => f && { ...f, name: e.target.value })} placeholder="Meera Devi" />
              </div>
              <div>
                <label style={labelStyle}>{t('stateRequiredLabel')}</label>
                <select style={inputStyle} required value={artisanForm.state}
                  onChange={e => setArtisanForm(f => f && { ...f, state: e.target.value })}>
                  <option value="">{t('selectStatePlaceholder')}</option>
                  {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('craftSkillLabel')}</label>
                <input style={inputStyle} required value={artisanForm.craft}
                  onChange={e => setArtisanForm(f => f && { ...f, craft: e.target.value })} placeholder="Madhubani Painting" />
              </div>
              <div>
                <label style={labelStyle}>{t('giProductLabel')}</label>
                <input style={inputStyle} value={artisanForm.gi_product}
                  onChange={e => setArtisanForm(f => f && { ...f, gi_product: e.target.value })} placeholder={tc('optional')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{
                  background: '#E8380A', color: '#fff', padding: '10px 20px', border: 'none',
                  borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', flex: 1,
                }}>
                  {t('confirmArrow')}
                </button>
                <button type="button" onClick={() => setArtisanForm(null)} style={{
                  background: 'none', color: '#6B4820', padding: '10px 16px',
                  border: '1.5px solid #DDB840', borderRadius: 6, fontWeight: 700, cursor: 'pointer',
                }}>
                  {tc('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
