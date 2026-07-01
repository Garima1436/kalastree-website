'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'

const CATEGORIES: Category[] = ['textile', 'handicraft', 'agricultural', 'food']
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
]
const autoSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

interface Props { artisanId: string | null; initialData?: any; mode?: 'new' | 'edit' }

export default function ArtisanProductForm({ artisanId, initialData, mode = 'new' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price?.toString() ?? '',
    gi_tag: initialData?.gi_tag ?? '',
    category: (initialData?.category ?? 'handicraft') as Category,
    state: initialData?.state ?? '',
    stock: initialData?.stock?.toString() ?? '1',
    image_url: initialData?.images?.[0] ?? '',
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setUploading(true); setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`
    const { error: upErr } = await supabase.storage.from('products').upload(fileName, file, { contentType: file.type, upsert: true })
    if (upErr) { setError(`Upload failed: ${upErr.message}`); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
    set('image_url', publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artisanId) { setError('Your account is not linked to an artisan profile. Contact the admin.'); return }
    setLoading(true); setError('')
    const slug = form.slug || autoSlug(form.name)
    const images = form.image_url ? [form.image_url] : (initialData?.images ?? [])
    const payload = {
      name: form.name, slug, description: form.description,
      price: parseFloat(form.price), gi_tag: form.gi_tag || null,
      category: form.category, state: form.state || null,
      stock: parseInt(form.stock), artisan_id: artisanId, images,
    }
    const res = await fetch('/api/artisan/products', {
      method: mode === 'edit' && initialData?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'edit' && initialData?.id ? { id: initialData.id, ...payload } : payload),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error ?? 'Failed to save'); setLoading(false) }
    else { router.push('/artisan/products'); router.refresh() }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #86EFAC', borderRadius: 6, fontSize: '0.92rem', background: '#F0FFF4', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: 5 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/artisan/products')} style={{ background: 'none', border: 'none', color: '#1A7A32', cursor: 'pointer', fontSize: '0.88rem' }}>← My Products</button>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '2rem', maxWidth: 760 }}>
        <div style={{ background: '#F0FFF4', border: '1px solid #86EFAC', borderRadius: 6, padding: '10px 14px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#1A7A32' }}>
          ℹ️ Your product will be reviewed by the admin before going live in the shop.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input style={inputStyle} required value={form.name}
                onChange={e => { set('name', e.target.value); if (!initialData) set('slug', autoSlug(e.target.value)) }}
                placeholder="Madhubani Fish Painting" />
            </div>
            <div>
              <label style={labelStyle}>URL Slug</label>
              <input style={inputStyle} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' } as any} value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Describe your product, materials, size, story…" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Price (₹) *</label>
              <input style={inputStyle} required type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="2500" />
            </div>
            <div>
              <label style={labelStyle}>Stock *</label>
              <input style={inputStyle} required type="number" min="1" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Category *</label>
              <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value as Category)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>GI Tag</label>
              <input style={inputStyle} value={form.gi_tag} onChange={e => set('gi_tag', e.target.value)} placeholder="Bihar Madhubani Paintings — GI Tag 2007" />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">— Select state —</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Product Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: 8, background: '#F0FFF4', border: '2px solid #86EFAC', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.image_url ? <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🏺</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ background: uploading ? '#86EFAC' : '#1A7A32', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 8, display: 'block' }}>
                  {uploading ? 'Uploading…' : '📷 Upload Image'}
                </button>
                <input style={{ ...inputStyle, fontSize: '0.8rem' }} value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="Or paste image URL" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              background: '#1A7A32', color: '#fff', padding: '12px 28px', border: 'none', borderRadius: 6,
              fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes →' : 'Submit for Approval →'}
            </button>
            <button type="button" onClick={() => router.push('/artisan/products')} style={{ background: 'none', color: '#1A7A32', padding: '12px 20px', border: '1.5px solid #86EFAC', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
