'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import type { Review } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

const supabase = createClient()

export function Stars({ value, size = '1rem' }: { value: number; size?: string }) {
  const rounded = Math.round(value)
  return (
    <span style={{ fontSize: size, letterSpacing: 1, color: '#D4A000' }}>
      {[1, 2, 3, 4, 5].map(i => (i <= rounded ? '★' : '☆')).join('')}
    </span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <span style={{ fontSize: '1.8rem', letterSpacing: 4, cursor: 'pointer', color: '#D4A000' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          {i <= (hover || value) ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1B2E4A', marginBottom: 6 }
const fieldInput: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #DDB840', borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }

const emptyForm = { rating: 0, title: '', body: '', youtube_url: '' }

export default function ProductReviews({ productId }: { productId: string }) {
  const { t } = useTranslation('shop')
  const { t: tc } = useTranslation('common')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    setReviews((data ?? []) as Review[])
    setLoading(false)
  }

  useEffect(() => { load() }, [productId])

  useEffect(() => {
    const applySession = async (session: any) => {
      const u = session?.user ?? null
      if (u?.id) {
        setUser({ id: u.id, email: u.email })
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', u.id).single()
        setDisplayName((profile as any)?.full_name || u.user_metadata?.full_name || u.email)
      } else {
        setUser(null)
        setDisplayName('')
      }
      setAuthChecked(true)
    }
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))
    return () => subscription.unsubscribe()
  }, [])

  const total = reviews.length
  const average = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
  const counts = [5, 4, 3, 2, 1].map(star => reviews.filter(r => r.rating === star).length)

  const cancel = () => {
    setForm(emptyForm)
    setMediaFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError('')
    setShowForm(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!user) return
    if (!form.rating || !form.body.trim()) {
      setError(t('reviewFormError'))
      return
    }
    setSubmitting(true)

    let media_url: string | null = null
    if (mediaFile) {
      const fileName = `${productId}/${Date.now()}-${mediaFile.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`
      const { error: upErr } = await supabase.storage.from('review-media').upload(fileName, mediaFile, { contentType: mediaFile.type, upsert: true })
      if (!upErr) {
        media_url = supabase.storage.from('review-media').getPublicUrl(fileName).data.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      reviewer_name: displayName,
      email: user.email,
      rating: form.rating,
      title: form.title.trim() || null,
      body: form.body.trim() || null,
      media_url,
      youtube_url: form.youtube_url.trim() || null,
    } as never)

    setSubmitting(false)
    if (insertError) { setError(t('reviewFormError')); return }
    cancel()
    load()
  }

  if (loading) return null

  return (
    <div id="reviews" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5% 4rem' }}>
      <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.4rem, 2.6vw, 1.8rem)', fontWeight: 700, color: '#1B2E4A', textAlign: 'center', marginBottom: '2rem' }}>
        {t('customerReviews')}
      </h2>

      {total > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.4rem', fontWeight: 700, color: '#1B2E4A', lineHeight: 1 }}>{average.toFixed(1)}</div>
            <Stars value={average} size="1.1rem" />
            <div style={{ fontSize: '0.78rem', color: '#6B4820', marginTop: 4 }}>{t('basedOnReviews').replace('{n}', String(total))}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
            {[5, 4, 3, 2, 1].map((star, i) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: '#6B4820' }}>
                <span style={{ width: 30 }}>{star}★</span>
                <div style={{ flex: 1, height: 6, background: '#FFE8A8', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${total ? (counts[i] / total) * 100 : 0}%`, height: '100%', background: '#D4A000' }} />
                </div>
                <span style={{ width: 18, textAlign: 'right' }}>{counts[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showForm && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {!authChecked ? null : user ? (
            <button onClick={() => setShowForm(true)} style={{ background: '#E8380A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              {t('writeAReview')}
            </button>
          ) : (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#6B4820', marginBottom: 10 }}>{t('signInToReview')}</p>
              <Link href="/login" style={{ display: 'inline-block', background: '#E8380A', color: '#fff', padding: '10px 24px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                {tc('signIn')}
              </Link>
            </div>
          )}
        </div>
      )}

      {showForm && user && (
        <form onSubmit={submit} style={{ maxWidth: 520, margin: '0 auto 2.5rem', background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1B2E4A', margin: '0 0 4px' }}>{t('writeAReview')}</h3>
            <p style={{ fontSize: '0.78rem', color: '#6B4820', margin: 0 }}>{t('postingAs').replace('{name}', displayName).replace('{email}', user.email)}</p>
          </div>

          <div>
            <label style={fieldLabel}>{t('rating')}</label>
            <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>

          <div>
            <label style={fieldLabel}>{t('reviewTitle')}</label>
            <input
              placeholder={t('reviewTitlePlaceholder')}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={fieldInput}
            />
          </div>

          <div>
            <label style={fieldLabel}>{t('reviewContent')}</label>
            <textarea
              placeholder={t('reviewContentPlaceholder')}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              style={{ ...fieldInput, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={fieldLabel}>{t('pictureVideoOptional')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={e => setMediaFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: '0.85rem', color: '#6B4820' }}
            />
            <input
              placeholder={t('youtubeUrl')}
              value={form.youtube_url}
              onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
              style={{ ...fieldInput, marginTop: '0.6rem' }}
            />
          </div>

          {error && <p style={{ color: '#E8380A', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, background: '#1A7A32', color: '#fff', border: 'none', padding: '11px', borderRadius: 6, fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? t('submitting') : t('submitReview')}
            </button>
            <button type="button" onClick={cancel} style={{ background: 'none', border: 'none', color: '#6B4820', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
              {t('cancelReview')}
            </button>
          </div>
        </form>
      )}

      {total === 0 ? (
        <p style={{ textAlign: 'center', color: '#6B4820', fontSize: '0.92rem' }}>{t('noReviewsYet')}</p>
      ) : (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ borderTop: '1px solid #FFE8A8', paddingTop: '1.25rem' }}>
              <Stars value={r.rating} />
              {r.title && <div style={{ fontWeight: 700, color: '#1B2E4A', marginTop: 6, fontSize: '0.95rem' }}>{r.title}</div>}
              {r.body && <p style={{ fontSize: '0.88rem', color: '#3A2A10', lineHeight: 1.6, marginTop: 4 }}>{r.body}</p>}
              {r.media_url && (
                r.media_url.match(/\.(mp4|mov|webm)$/i)
                  ? <video src={r.media_url} controls style={{ maxWidth: 240, borderRadius: 8, marginTop: 8, display: 'block' }} />
                  : <img src={r.media_url} alt="" style={{ maxWidth: 160, borderRadius: 8, marginTop: 8, display: 'block' }} />
              )}
              {r.youtube_url && (
                <a href={r.youtube_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: '0.82rem', color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
                  ▶ {t('watchVideo')}
                </a>
              )}
              <div style={{ fontSize: '0.76rem', color: '#6B4820', marginTop: 6 }}>
                {r.reviewer_name} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
