'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/RichTextEditor'
import TranslateHindiField from '@/components/TranslateHindiField'

interface Props {
  initialData?: any
  mode?: 'new' | 'edit'
}

// TipTap's getHTML() returns "<p></p>" (truthy) for an empty editor, not
// "" — this treats that (and any all-empty-paragraphs variant) as empty.
const isEmptyHtml = (html: string) => !html || /^(<p>\s*<\/p>\s*)+$/.test(html.trim())

export default function NewsForm({ initialData, mode = 'new' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [error, setError] = useState('')
  const [translatingBody, setTranslatingBody] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoFileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    title_hi: initialData?.title_hi ?? '',
    author: initialData?.author ?? '',
    body: initialData?.body ?? '',
    body_hi: initialData?.body_hi ?? '',
    image_url: initialData?.image_url ?? '',
    video_url: initialData?.video_url ?? '',
    external_link: initialData?.external_link ?? '',
    published_at: initialData?.published_at ?? new Date().toISOString().slice(0, 10),
  })

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const handleTranslateBody = async () => {
    if (isEmptyHtml(form.body) || translatingBody) return
    setTranslatingBody(true)
    setError('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.body, target: 'hi', format: 'html' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Translation failed'); return }
      set('body_hi', data.translated)
    } catch {
      setError('Translation failed')
    } finally {
      setTranslatingBody(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }

    setUploading(true)
    setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`

    const { error: uploadError } = await supabase.storage
      .from('news-events').upload(fileName, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('news-events').getPublicUrl(fileName)
      set('image_url', publicUrl)
    }
    setUploading(false)
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { setError('Please select a video file.'); return }
    // Matches the news-events bucket's 50MB file size limit — checked
    // client-side first so the error is immediate and friendly rather
    // than a raw upload failure from Supabase.
    if (file.size > 50 * 1024 * 1024) { setError('Video must be under 50MB.'); return }

    setUploadingVideo(true)
    setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`

    const { error: uploadError } = await supabase.storage
      .from('news-events').upload(fileName, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('news-events').getPublicUrl(fileName)
      set('video_url', publicUrl)
    }
    setUploadingVideo(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title: form.title,
      title_hi: form.title_hi || null,
      author: form.author || null,
      body: isEmptyHtml(form.body) ? null : form.body,
      body_hi: isEmptyHtml(form.body_hi) ? null : form.body_hi,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      external_link: form.external_link || null,
      published_at: form.published_at,
    }

    const res = await fetch('/api/admin/news', {
      method: mode === 'edit' && initialData?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'edit' && initialData?.id ? { id: initialData.id, ...payload } : payload),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error ?? 'Failed to save'); setLoading(false) }
    else { router.push('/admin/news'); router.refresh() }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #DDB840',
    borderRadius: 6, fontSize: '0.92rem', background: '#FFF8EE', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', marginBottom: 5,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/news')} style={{ background: 'none', border: 'none', color: '#6B4820', cursor: 'pointer', fontSize: '0.88rem' }}>
          ← Back to News & Events
        </button>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {mode === 'edit' ? 'Edit Entry' : 'Add Entry'}
        </h1>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', maxWidth: 700 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} required value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Introducing our Buyer Protection Program" />
          </div>

          <TranslateHindiField
            label="Title (Hindi, optional)"
            sourceText={form.title}
            value={form.title_hi}
            onChange={v => set('title_hi', v)}
            translateLabel="Auto-translate"
            translatingLabel="Translating..."
            hint="Shown when this entry is displayed in Hindi."
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Author (optional)</label>
              <input style={inputStyle} value={form.author}
                onChange={e => set('author', e.target.value)}
                placeholder="Garima Awasthi" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="date" required value={form.published_at}
                onChange={e => set('published_at', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Body</label>
            <RichTextEditor value={form.body} onChange={html => set('body', html)} storageBucket="news-events" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={labelStyle}>Body (Hindi, optional)</label>
              <button
                type="button"
                onClick={handleTranslateBody}
                disabled={translatingBody || isEmptyHtml(form.body)}
                style={{
                  fontSize: '0.7rem', fontWeight: 700, color: '#1A7A32', background: 'none', border: 'none',
                  cursor: isEmptyHtml(form.body) ? 'not-allowed' : 'pointer', opacity: isEmptyHtml(form.body) ? 0.5 : 1, padding: 0,
                }}
              >
                {translatingBody ? 'Translating...' : '🌐 Auto-translate'}
              </button>
            </div>
            <RichTextEditor value={form.body_hi} onChange={html => set('body_hi', html)} storageBucket="news-events" />
            <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>Shown when this entry is displayed in Hindi.</p>
          </div>

          <div>
            <label style={labelStyle}>External Link (optional)</label>
            <input style={inputStyle} value={form.external_link}
              onChange={e => set('external_link', e.target.value)}
              placeholder="https://... (press article, event page, etc.)" />
          </div>

          <div>
            <label style={labelStyle}>Video (optional)</label>
            <input ref={videoFileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
            <button type="button" onClick={() => videoFileInputRef.current?.click()} disabled={uploadingVideo}
              style={{ background: uploadingVideo ? '#A07840' : '#1B2E4A', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: uploadingVideo ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
              {uploadingVideo ? 'Uploading...' : 'Upload video from computer'}
            </button>
            <input style={inputStyle} value={form.video_url}
              onChange={e => set('video_url', e.target.value)}
              placeholder="or paste a YouTube/Vimeo link, or a direct video URL" />
            <div style={{ fontSize: '0.75rem', color: '#A07840', marginTop: 6 }}>
              Uploaded files play inline; a YouTube/Vimeo link shows as an embedded player. Uploads are capped at 50MB — for anything larger, upload to YouTube/Vimeo and paste the link instead.
            </div>
          </div>

          <div>
            <label style={labelStyle}>Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: 8, background: '#FFE8A8', border: '2px solid #DDB840', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2rem' }}>📰</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ background: uploading ? '#A07840' : '#1B2E4A', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 8, display: 'block' }}>
                  {uploading ? 'Uploading...' : 'Upload from computer'}
                </button>
                <input style={{ ...inputStyle, fontSize: '0.8rem' }} value={form.image_url}
                  onChange={e => set('image_url', e.target.value)} placeholder="or paste an image URL" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              background: '#E8380A', color: '#fff', padding: '12px 28px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Entry'}
            </button>
            <button type="button" onClick={() => router.push('/admin/news')} style={{
              background: 'none', color: '#6B4820', padding: '12px 20px',
              border: '1.5px solid #DDB840', borderRadius: 6, fontWeight: 700, cursor: 'pointer',
            }}>
              Cancel
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
