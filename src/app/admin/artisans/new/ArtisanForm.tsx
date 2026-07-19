'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { INDIAN_STATES } from '@/lib/indian-states'
import { useTranslation } from '@/lib/i18n/useTranslation'

const autoSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

interface Props {
  initialData?: any
  mode?: 'new' | 'edit'
}

export default function ArtisanForm({ initialData, mode = 'new' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation('adminArtisans')
  const { t: tc } = useTranslation('common')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError(t('selectImageError')); return }
    if (file.size > 5 * 1024 * 1024) { setError(t('imageSizeError')); return }

    setUploading(true)
    setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`

    const { error: uploadError } = await supabase.storage
      .from('artisans').upload(fileName, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(t('uploadFailedPrefix') + uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('artisans').getPublicUrl(fileName)
      set('photo_url', publicUrl)
    }
    setUploading(false)
  }
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    state: initialData?.state ?? '',
    craft: initialData?.craft ?? '',
    gi_product: initialData?.gi_product ?? '',
    bio: initialData?.bio ?? '',
    story: initialData?.story ?? '',
    photo_url: initialData?.photo_url ?? '',
    is_verified: initialData?.is_verified ?? false,
    is_featured: initialData?.is_featured ?? false,
    ithink_pickup_address_id: initialData?.ithink_pickup_address_id?.toString() ?? '',
    ithink_return_address_id: initialData?.ithink_return_address_id?.toString() ?? '',
  })

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const slug = form.slug || autoSlug(form.name)
    const payload = {
      name: form.name, slug,
      state: form.state, craft: form.craft,
      gi_product: form.gi_product || null,
      bio: form.bio || null, story: form.story || null,
      photo_url: form.photo_url || null,
      is_verified: form.is_verified,
      is_featured: form.is_featured,
      ithink_pickup_address_id: form.ithink_pickup_address_id ? parseInt(form.ithink_pickup_address_id) : null,
      ithink_return_address_id: form.ithink_return_address_id
        ? parseInt(form.ithink_return_address_id)
        : (form.ithink_pickup_address_id ? parseInt(form.ithink_pickup_address_id) : null),
    }

    const res = await fetch('/api/admin/artisans', {
      method: mode === 'edit' && initialData?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'edit' && initialData?.id ? { id: initialData.id, ...payload } : payload),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error ?? t('saveFailedDefault')); setLoading(false) }
    else { router.push('/admin/artisans'); router.refresh() }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840',
    borderRadius: 6, fontSize: '0.92rem', background: '#FFF8EE', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 5,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/artisans')} style={{ background: 'none', border: 'none', color: '#6B4820', cursor: 'pointer', fontSize: '0.88rem' }}>
          {t('backToArtisans')}
        </button>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {mode === 'edit' ? t('editHeading') : t('addHeading')}
        </h1>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', maxWidth: 760 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('fullNameLabel')}</label>
              <input style={inputStyle} required value={form.name}
                onChange={e => { set('name', e.target.value); if (!initialData) set('slug', autoSlug(e.target.value)) }}
                placeholder="Meera Devi" />
            </div>
            <div>
              <label style={labelStyle}>{t('urlSlugLabel')}</label>
              <input style={inputStyle} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder={t('slugPlaceholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('stateLabel')}</label>
              <select style={inputStyle} required value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">{t('selectStatePlaceholder')}</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('craftLabel')}</label>
              <input style={inputStyle} required value={form.craft} onChange={e => set('craft', e.target.value)}
                placeholder="Madhubani Painting" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('giProductLabel')}</label>
            <input style={inputStyle} value={form.gi_product} onChange={e => set('gi_product', e.target.value)}
              placeholder="Bihar Madhubani Paintings — GI Tag 2007" />
          </div>

          <div>
            <label style={labelStyle}>{t('photoLabel')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Preview */}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FFE8A8', border: '2px solid #DDB840', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.photo_url
                  ? <img src={form.photo_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2rem' }}>👩‍🎨</span>}
              </div>
              <div style={{ flex: 1 }}>
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload}
                  style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ background: uploading ? '#A07840' : '#1B2E4A', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
                  {uploading ? t('uploading') : t('uploadFromComputer')}
                </button>
                <div style={{ fontSize: '0.75rem', color: '#A07840' }}>{t('photoHelp')}</div>
                {/* Or paste URL */}
                <input style={{ ...inputStyle, marginTop: 8, fontSize: '0.8rem' }} value={form.photo_url}
                  onChange={e => set('photo_url', e.target.value)} placeholder={t('pasteImageUrlPlaceholder')} />
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('shortBioLabel')}</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' } as any} value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder={t('bioPlaceholder')} />
            <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>
              {t('markdownHelp')}
            </p>
          </div>

          <div>
            <label style={labelStyle}>{t('storyLabel')}</label>
            <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' } as any} value={form.story}
              onChange={e => set('story', e.target.value)}
              placeholder={t('storyPlaceholder')} />
            <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>
              {t('markdownHelp')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>iThink Pickup Warehouse ID</label>
              <input style={inputStyle} type="number" value={form.ithink_pickup_address_id}
                onChange={e => set('ithink_pickup_address_id', e.target.value)} placeholder="e.g. 24" />
              <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>
                From iThink dashboard → Warehouse, for this artisan&apos;s pickup location. Required before this artisan can auto-generate a shipping label.
              </p>
            </div>
            <div>
              <label style={labelStyle}>iThink Return Warehouse ID</label>
              <input style={inputStyle} type="number" value={form.ithink_return_address_id}
                onChange={e => set('ithink_return_address_id', e.target.value)} placeholder="Same as pickup if blank" />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: '#1B2E4A', fontWeight: 600 }}>
            <input type="checkbox" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)}
              style={{ width: 17, height: 17, accentColor: '#1A7A32' }} />
            {t('markGiVerifiedLabel')} <span style={{ fontSize: '0.75rem', color: '#6B4820', fontWeight: 400 }}>{t('markGiVerifiedHint')}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: '#1B2E4A', fontWeight: 600 }}>
            <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)}
              style={{ width: 17, height: 17, accentColor: '#3730A3' }} />
            {t('featureHomepageLabel')} <span style={{ fontSize: '0.75rem', color: '#6B4820', fontWeight: 400 }}>{t('featureHomepageHint')}</span>
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              background: '#E8380A', color: '#fff', padding: '12px 28px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? t('saving') : mode === 'edit' ? t('saveChanges') : t('addArtisanSubmit')}
            </button>
            <button type="button" onClick={() => router.push('/admin/artisans')} style={{
              background: 'none', color: '#6B4820', padding: '12px 20px',
              border: '1.5px solid #DDB840', borderRadius: 6, fontWeight: 700, cursor: 'pointer',
            }}>
              {tc('cancel')}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
