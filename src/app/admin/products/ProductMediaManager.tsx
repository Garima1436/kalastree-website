'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  source: 'upload' | 'youtube'
  sort_order: number
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/)
  return m ? m[1] : null
}

function YouTubeThumbnail({ url }: { url: string }) {
  const id = extractYouTubeId(url)
  if (!id) return <div style={{ width: '100%', height: '100%', background: '#1B2E4A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '1.5rem' }}>▶️</span></div>
  return <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="YouTube thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

export default function ProductMediaManager({ productId }: { productId: string }) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytError, setYtError] = useState('')
  const [error, setError] = useState('')
  const imgInputRef = useRef<HTMLInputElement>(null)
  const vidInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setMedia((data ?? []) as MediaItem[])
  }

  useEffect(() => { load() }, [productId])

  const uploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError('')
    const supabase = createClient()
    const nextOrder = media.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      if (file.size > 10 * 1024 * 1024) { setError(`${file.name} exceeds 10MB — skipped`); continue }

      const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`
      const { error: upErr } = await supabase.storage.from('products').upload(fileName, file, { contentType: file.type, upsert: true })
      if (upErr) { setError(`Upload failed: ${upErr.message}`); continue }

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
      await fetch('/api/admin/product-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, url: publicUrl, type: 'image', source: 'upload', sort_order: nextOrder + i }),
      })
    }

    setUploading(false)
    if (imgInputRef.current) imgInputRef.current.value = ''
    load()
  }

  const uploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { setError('Please select a video file'); return }
    if (file.size > 200 * 1024 * 1024) { setError('Video must be under 200MB'); return }

    setUploadingVideo(true)
    setError('')
    const supabase = createClient()
    const fileName = `videos/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`
    const { error: upErr } = await supabase.storage.from('products').upload(fileName, file, { contentType: file.type, upsert: true })
    if (upErr) { setError(`Video upload failed: ${upErr.message}`); setUploadingVideo(false); return }

    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
    await fetch('/api/admin/product-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, url: publicUrl, type: 'video', source: 'upload', sort_order: media.length }),
    })
    setUploadingVideo(false)
    if (vidInputRef.current) vidInputRef.current.value = ''
    load()
  }

  const addYouTube = async () => {
    setYtError('')
    const id = extractYouTubeId(ytUrl.trim())
    if (!id) { setYtError('Not a valid YouTube URL'); return }

    await fetch('/api/admin/product-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, url: ytUrl.trim(), type: 'video', source: 'youtube', sort_order: media.length }),
    })
    setYtUrl('')
    load()
  }

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Delete this ${item.type}?`)) return
    let storagePath: string | undefined
    if (item.source === 'upload') {
      const match = item.url.match(/\/products\/(.+)$/)
      if (match) storagePath = match[1]
    }
    await fetch('/api/admin/product-media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, storage_path: storagePath }),
    })
    load()
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= media.length) return
    const updated = [...media]
    ;[updated[idx], updated[target]] = [updated[target], updated[idx]]
    setMedia(updated)
    await Promise.all([
      fetch('/api/admin/product-media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: updated[idx].id, sort_order: idx }) }),
      fetch('/api/admin/product-media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: updated[target].id, sort_order: target }) }),
    ])
  }

  const labelStyle: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4820', display: 'block', marginBottom: 6 }
  const btnStyle = (color = '#1B2E4A'): React.CSSProperties => ({ background: color, color: '#fff', padding: '9px 18px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' as const })

  return (
    <div style={{ marginTop: '2rem', borderTop: '2px solid #DDB840', paddingTop: '1.75rem' }}>
      <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '1.25rem' }}>
        Product Media
      </h2>

      {error && <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '8px 12px', color: '#B91C1C', fontSize: '0.82rem', marginBottom: '1rem' }}>{error}</div>}

      {/* Existing media grid */}
      {media.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {media.map((item, idx) => (
            <div key={item.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #DDB840', background: '#FFE8A8', aspectRatio: '4/3' }}>
              {/* Thumbnail */}
              <div style={{ width: '100%', height: '100%' }}>
                {item.type === 'image' && <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {item.type === 'video' && item.source === 'youtube' && <YouTubeThumbnail url={item.url} />}
                {item.type === 'video' && item.source === 'upload' && (
                  <div style={{ width: '100%', height: '100%', background: '#1B2E4A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '1.8rem' }}>🎥</span>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Lato', sans-serif" }}>VIDEO</span>
                  </div>
                )}
              </div>

              {/* Type badge */}
              <div style={{ position: 'absolute', top: 5, left: 5, background: item.type === 'video' ? '#E8380A' : '#1B2E4A', color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.type === 'video' ? (item.source === 'youtube' ? 'YT' : 'MP4') : 'IMG'}
              </div>

              {/* Controls overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '6px' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Move left"
                    style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(255,255,255,0.85)', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === media.length - 1} title="Move right"
                    style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(255,255,255,0.85)', border: 'none', cursor: idx === media.length - 1 ? 'default' : 'pointer', opacity: idx === media.length - 1 ? 0.3 : 1, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
                </div>
                <button onClick={() => deleteMedia(item)} title="Delete"
                  style={{ width: 22, height: 22, borderRadius: 4, background: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>✕</button>
              </div>

              {idx === 0 && <div style={{ position: 'absolute', top: 5, right: 5, background: '#D4A000', color: '#fff', fontSize: '0.5rem', fontWeight: 700, padding: '2px 5px', borderRadius: 3 }}>COVER</div>}
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <p style={{ color: '#A07840', fontSize: '0.85rem', marginBottom: '1.25rem', fontStyle: 'italic' }}>No media added yet. Upload images or videos below.</p>
      )}

      {/* Upload section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Images */}
        <div style={{ background: '#FFF5E0', border: '1.5px solid #DDB840', borderRadius: 8, padding: '1.25rem' }}>
          <label style={labelStyle}>📷 Add Images</label>
          <p style={{ fontSize: '0.75rem', color: '#A07840', marginBottom: '0.75rem' }}>Select multiple at once · JPG, PNG, WebP · Max 10MB each</p>
          <input ref={imgInputRef} type="file" accept="image/*" multiple onChange={uploadImages} style={{ display: 'none' }} />
          <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploading} style={btnStyle(uploading ? '#A07840' : '#1B2E4A')}>
            {uploading ? 'Uploading…' : '+ Upload Images'}
          </button>
        </div>

        {/* Videos */}
        <div style={{ background: '#FFF5E0', border: '1.5px solid #DDB840', borderRadius: 8, padding: '1.25rem' }}>
          <label style={labelStyle}>🎥 Add Video</label>

          {/* Upload video */}
          <div style={{ marginBottom: '0.75rem' }}>
            <input ref={vidInputRef} type="file" accept="video/*" onChange={uploadVideo} style={{ display: 'none' }} />
            <button type="button" onClick={() => vidInputRef.current?.click()} disabled={uploadingVideo} style={{ ...btnStyle(uploadingVideo ? '#A07840' : '#E8380A'), marginBottom: 6, display: 'block' }}>
              {uploadingVideo ? 'Uploading…' : '⬆ Upload Video File'}
            </button>
            <div style={{ fontSize: '0.7rem', color: '#A07840' }}>MP4, MOV, WebM · Max 200MB</div>
          </div>

          {/* YouTube URL */}
          <div style={{ borderTop: '1px solid #DDB840', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B4820', marginBottom: 5 }}>OR paste YouTube URL</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={ytUrl}
                onChange={e => { setYtUrl(e.target.value); setYtError('') }}
                placeholder="https://youtube.com/watch?v=..."
                style={{ flex: 1, padding: '7px 10px', border: `1.5px solid ${ytError ? '#EF4444' : '#DDB840'}`, borderRadius: 6, fontSize: '0.78rem', background: '#FFFFFF', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addYouTube() } }}
              />
              <button type="button" onClick={addYouTube} style={btnStyle('#D4A000')}>Add</button>
            </div>
            {ytError && <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: 4 }}>{ytError}</div>}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: '0.75rem' }}>
        First item is shown as the cover image on product cards. Use ◀ ▶ to reorder.
      </p>
    </div>
  )
}
