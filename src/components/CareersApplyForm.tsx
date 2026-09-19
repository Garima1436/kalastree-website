'use client'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

const inp = { width: '100%', background: 'rgba(253,246,227,0.8)', border: '1.5px solid #DDB840', borderRadius: 6, padding: '12px 16px', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: '#1A1A1A', outline: 'none' } as const
const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 8 } as const

const MAX_RESUME_BYTES = 4 * 1024 * 1024
const RESUME_EXTENSIONS = ['pdf', 'doc', 'docx']

// `job` ties the application to one specific opening: its id is sent with the form and the
// server takes the role name from the database, so the role field is fixed. Without it this
// is the general application, with a free-text role.
export default function CareersApplyForm({ job }: { job?: { id: string; title: string } }) {
  const { t } = useTranslation('careers')
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', role: job?.title ?? '', link: '', message: '', website: '' })
  const [resume, setResume] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  // The server re-checks type, size and file contents; this just gives instant feedback.
  const onResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError('')
    if (!file) { setResume(null); return }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!RESUME_EXTENSIONS.includes(ext)) {
      setError(t('fileTypeError')); setResume(null); e.target.value = ''; return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError(t('fileTooLarge')); setResume(null); e.target.value = ''; return
    }
    setResume(file)
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.location || !form.role || !form.message || !resume) return
    setStatus('loading')
    setError('')

    const body = new FormData()
    Object.entries(form).forEach(([k, v]) => body.append(k, v))
    if (resume) body.append('resume', resume)
    if (job) body.append('jobId', job.id)

    try {
      const res = await fetch('/api/careers-apply', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setConfirmed(!!data.confirmed)
        setStatus('success')
        return
      }
      const byCode: Record<string, string> = {
        file_too_large: t('fileTooLarge'),
        file_type: t('fileTypeError'),
        rate_limited: t('rateLimited'),
        job_unavailable: t('jobUnavailable'),
      }
      setError(byCode[data.code] ?? t('errorMessage'))
      setStatus('error')
    } catch {
      setError(t('errorMessage'))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div id="apply" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#C8F5D8', borderRadius: 12, border: '2px solid #1A7A32' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
        <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1A7A32', marginBottom: '1rem' }}>{t('successTitle')}</h2>
        <p style={{ color: '#6B4820', lineHeight: 1.8 }}>
          {t('successBody')}
          {confirmed && <> {t('successConfirmation')} <strong>{form.email}</strong>.</>}
        </p>
      </div>
    )
  }

  return (
    <form id="apply" onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2.5rem', scrollMarginTop: 90 }}>
      <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '0.5rem' }}>{t('formTitle')}</h2>
      <p style={{ color: '#6B4820', lineHeight: 1.7, marginBottom: '2rem' }}>{t('formIntro')}</p>

      <div className="careers-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={lbl}>{t('labelName')}</label>
          <input required maxLength={100} style={inp} value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label style={lbl}>{t('labelEmail')}</label>
          <input required type="email" maxLength={200} style={inp} value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
      </div>

      <div className="careers-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={lbl}>{t('labelPhone')}</label>
          <input required maxLength={30} style={inp} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label style={lbl}>{t('labelLocation')}</label>
          <input required maxLength={100} style={inp} value={form.location} onChange={set('location')} />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={lbl}>{t('labelRole')}</label>
        <input required maxLength={100} style={job ? { ...inp, background: '#F3EBD3', cursor: 'not-allowed' } : inp} value={form.role} onChange={set('role')} readOnly={!!job} placeholder={t('placeholderRole')} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={lbl}>{t('labelResume')}</label>
        <input required type="file" accept=".pdf,.doc,.docx" onChange={onResumeChange} style={{ ...inp, padding: '10px 12px' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={lbl}>{t('labelLink')}</label>
        <input maxLength={300} style={inp} value={form.link} onChange={set('link')} placeholder={t('placeholderLink')} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={lbl}>{t('labelMessage')}</label>
        <textarea required rows={5} maxLength={3000} style={{ ...inp, resize: 'vertical' }} value={form.message} onChange={set('message')} placeholder={t('placeholderMessage')} />
      </div>

      {/* Honeypot: hidden from people and assistive tech; only bots fill it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={set('website')}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <button type="submit" disabled={status === 'loading'} style={{ width: '100%', background: status === 'loading' ? '#aaa' : '#1A7A32', color: '#fff', padding: '14px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
        {status === 'loading' ? t('submitting') : t('submitCta')}
      </button>
      {error && <p role="alert" style={{ color: '#E8380A', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}

      <p style={{ color: '#8A6A3A', fontSize: '0.8rem', lineHeight: 1.6, textAlign: 'center', marginTop: '1.25rem' }}>
        {t('dataNote')} {t('inclusionNote')}
      </p>

      <style>{`
        @media(max-width:600px){
          .careers-form-grid { grid-template-columns:1fr !important; }
        }
      `}</style>
    </form>
  )
}
