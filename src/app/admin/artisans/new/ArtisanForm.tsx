'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Ladakh',
]

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }

    setUploading(true)
    setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`

    const { error: uploadError } = await supabase.storage
      .from('artisans').upload(fileName, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
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
    }

    const res = await fetch('/api/admin/artisans', {
      method: mode === 'edit' && initialData?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'edit' && initialData?.id ? { id: initialData.id, ...payload } : payload),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error ?? 'Failed to save'); setLoading(false) }
    else { router.push('/admin/artisans'); router.refresh() }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #D9C9A8',
    borderRadius: 6, fontSize: '0.92rem', background: '#FDF6E3', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginBottom: 5,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/artisans')} style={{ background: 'none', border: 'none', color: '#5C5542', cursor: 'pointer', fontSize: '0.88rem' }}>
          ← Artisans
        </button>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {mode === 'edit' ? 'Edit Artisan' : 'Add New Artisan'}
        </h1>
      </div>

      <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, padding: '2rem', maxWidth: 760 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} required value={form.name}
                onChange={e => { set('name', e.target.value); if (!initialData) set('slug', autoSlug(e.target.value)) }}
                placeholder="Meera Devi" />
            </div>
            <div>
              <label style={labelStyle}>URL Slug</label>
              <input style={inputStyle} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>State *</label>
              <select style={inputStyle} required value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">— Select State —</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Craft / Skill *</label>
              <input style={inputStyle} required value={form.craft} onChange={e => set('craft', e.target.value)}
                placeholder="Madhubani Painting" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>GI Product</label>
            <input style={inputStyle} value={form.gi_product} onChange={e => set('gi_product', e.target.value)}
              placeholder="Bihar Madhubani Paintings — GI Tag 2007" />
          </div>

          <div>
            <label style={labelStyle}>Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Preview */}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F2E8D5', border: '2px solid #D9C9A8', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.photo_url
                  ? <img src={form.photo_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2rem' }}>👩‍🎨</span>}
              </div>
              <div style={{ flex: 1 }}>
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload}
                  style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ background: uploading ? '#9A8E7A' : '#1B2E4A', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
                  {uploading ? 'Uploading…' : '📷 Upload from Computer'}
                </button>
                <div style={{ fontSize: '0.75rem', color: '#9A8E7A' }}>JPG, PNG, WebP · Max 5MB · Auto-saves to Supabase Storage</div>
                {/* Or paste URL */}
                <input style={{ ...inputStyle, marginTop: 8, fontSize: '0.8rem' }} value={form.photo_url}
                  onChange={e => set('photo_url', e.target.value)} placeholder="Or paste image URL directly" />
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Short Bio</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' } as any} value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="A brief introduction about the artisan…" />
          </div>

          <div>
            <label style={labelStyle}>Story</label>
            <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' } as any} value={form.story}
              onChange={e => set('story', e.target.value)}
              placeholder="Their journey, struggles, and craft tradition…" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: '#1B2E4A', fontWeight: 600 }}>
            <input type="checkbox" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)}
              style={{ width: 17, height: 17, accentColor: '#3B5A2F' }} />
            Mark as GI Verified Artisan
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              background: '#C94B1A', color: '#fff', padding: '12px 28px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes →' : 'Add Artisan →'}
            </button>
            <button type="button" onClick={() => router.push('/admin/artisans')} style={{
              background: 'none', color: '#5C5542', padding: '12px 20px',
              border: '1.5px solid #D9C9A8', borderRadius: 6, fontWeight: 700, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
