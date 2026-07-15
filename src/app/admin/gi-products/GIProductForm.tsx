'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { INDIAN_STATES } from '@/lib/indian-states'
import { useTranslation } from '@/lib/i18n/useTranslation'
import TranslateHindiField from '@/components/TranslateHindiField'

const CATEGORIES = ['textile', 'handicraft', 'agricultural', 'food'] as const
const CATEGORY_LABEL_KEYS: Record<(typeof CATEGORIES)[number], 'categoryTextile' | 'categoryHandicraft' | 'categoryAgricultural' | 'categoryFood'> = {
  textile: 'categoryTextile',
  handicraft: 'categoryHandicraft',
  agricultural: 'categoryAgricultural',
  food: 'categoryFood',
}

interface Props {
  initialData?: any
  mode?: 'new' | 'edit'
}

export default function GIProductForm({ initialData, mode = 'new' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation('adminGiProducts')
  const { t: tc } = useTranslation('common')

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    name_hi: initialData?.name_hi ?? '',
    state: initialData?.state ?? '',
    category: initialData?.category ?? 'handicraft',
    gi_tag: initialData?.gi_tag ?? '',
    year: initialData?.year ?? '',
    emoji: initialData?.emoji ?? '',
    accent: initialData?.accent ?? '#E8380A',
    women_percent: initialData?.women_percent?.toString() ?? '',
    tagline: initialData?.tagline ?? '',
    tagline_hi: initialData?.tagline_hi ?? '',
    women_role: initialData?.women_role ?? '',
    women_role_hi: initialData?.women_role_hi ?? '',
    history: initialData?.history ?? '',
    history_hi: initialData?.history_hi ?? '',
    materials: initialData?.materials ?? '',
    materials_hi: initialData?.materials_hi ?? '',
    district: initialData?.district ?? '',
    image_url: initialData?.image_url ?? '',
  })

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError(t('selectImageError')); return }
    if (file.size > 5 * 1024 * 1024) { setError(t('imageSizeError')); return }

    setUploading(true)
    setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`

    const { error: uploadError } = await supabase.storage
      .from('gi-products').upload(fileName, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(t('uploadFailedPrefix') + uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('gi-products').getPublicUrl(fileName)
      set('image_url', publicUrl)
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      name: form.name,
      name_hi: form.name_hi || null,
      state: form.state || null,
      category: form.category || null,
      gi_tag: form.gi_tag || null,
      year: form.year || null,
      emoji: form.emoji || null,
      accent: form.accent || null,
      women_percent: form.women_percent !== '' ? parseInt(form.women_percent) : null,
      tagline: form.tagline || null,
      tagline_hi: form.tagline_hi || null,
      women_role: form.women_role || null,
      women_role_hi: form.women_role_hi || null,
      history: form.history || null,
      history_hi: form.history_hi || null,
      materials: form.materials || null,
      materials_hi: form.materials_hi || null,
      district: form.district || null,
      image_url: form.image_url || null,
    }

    const res = await fetch('/api/admin/gi-products', {
      method: mode === 'edit' && initialData?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'edit' && initialData?.id ? { id: initialData.id, ...payload } : payload),
    })
    const result = await res.json()
    if (!res.ok) { setError(result.error ?? t('saveFailedDefault')); setLoading(false) }
    else { router.push('/admin/gi-products'); router.refresh() }
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
        <button onClick={() => router.push('/admin/gi-products')} style={{ background: 'none', border: 'none', color: '#6B4820', cursor: 'pointer', fontSize: '0.88rem' }}>
          {t('backToGiProducts')}
        </button>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {mode === 'edit' ? t('editHeading') : t('addHeading')}
        </h1>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', maxWidth: 800 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 14px', color: '#B91C1C', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Row 1: Name + State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('nameLabel')}</label>
              <input style={inputStyle} required value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Pochampally Ikat" />
            </div>
            <div>
              <label style={labelStyle}>{t('stateLabel')}</label>
              <select style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">{t('selectStatePlaceholder')}</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <TranslateHindiField
            label={t('nameHiLabel')}
            sourceText={form.name}
            value={form.name_hi}
            onChange={v => set('name_hi', v)}
            translateLabel={t('autoTranslateBtn')}
            translatingLabel={t('translatingBtn')}
            hint={t('hindiOptionalHint')}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          {/* Row 2: Category + GI Tag */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('categoryLabel')}</label>
              <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{t(CATEGORY_LABEL_KEYS[c])}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('giTagLabel')}</label>
              <input style={inputStyle} value={form.gi_tag} onChange={e => set('gi_tag', e.target.value)}
                placeholder="GI Tag No. 213" />
            </div>
          </div>

          {/* Row 3: Year + Emoji + Accent + Women% */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('yearLabel')}</label>
              <input style={inputStyle} value={form.year} onChange={e => set('year', e.target.value)}
                placeholder="2007" />
            </div>
            <div>
              <label style={labelStyle}>{t('emojiLabel')}</label>
              <input style={inputStyle} value={form.emoji} onChange={e => set('emoji', e.target.value)}
                placeholder="🧵" maxLength={2} />
            </div>
            <div>
              <label style={labelStyle}>{t('accentColorLabel')}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.accent} onChange={e => set('accent', e.target.value)}
                  style={{ width: 44, height: 40, border: '1.5px solid #DDB840', borderRadius: 6, padding: 2, cursor: 'pointer', background: '#FFF8EE' }} />
                <input style={{ ...inputStyle, flex: 1 }} value={form.accent} onChange={e => set('accent', e.target.value)}
                  placeholder="#E8380A" maxLength={7} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('womenPercentLabel')}</label>
              <input style={inputStyle} type="number" min={0} max={100}
                value={form.women_percent} onChange={e => set('women_percent', e.target.value)}
                placeholder="85" />
            </div>
          </div>

          {/* Row 4: District + Materials */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('districtLabel')}</label>
              <input style={inputStyle} value={form.district} onChange={e => set('district', e.target.value)}
                placeholder="Nalgonda" />
            </div>
            <div>
              <label style={labelStyle}>{t('materialsLabel')}</label>
              <input style={inputStyle} value={form.materials} onChange={e => set('materials', e.target.value)}
                placeholder="Silk, Cotton" />
            </div>
          </div>

          <TranslateHindiField
            label={t('materialsHiLabel')}
            sourceText={form.materials}
            value={form.materials_hi}
            onChange={v => set('materials_hi', v)}
            translateLabel={t('autoTranslateBtn')}
            translatingLabel={t('translatingBtn')}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          {/* Tagline */}
          <div>
            <label style={labelStyle}>{t('taglineLabel')}</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' } as any}
              value={form.tagline} onChange={e => set('tagline', e.target.value)}
              placeholder={t('taglinePlaceholder')} />
          </div>

          <TranslateHindiField
            label={t('taglineHiLabel')}
            sourceText={form.tagline}
            value={form.tagline_hi}
            onChange={v => set('tagline_hi', v)}
            multiline
            translateLabel={t('autoTranslateBtn')}
            translatingLabel={t('translatingBtn')}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          {/* Women & Heritage Role */}
          <div>
            <label style={labelStyle}>{t('womenRoleLabel')}</label>
            <textarea style={{ ...inputStyle, minHeight: 130, resize: 'vertical' } as any}
              value={form.women_role} onChange={e => set('women_role', e.target.value)}
              placeholder={t('womenRolePlaceholder')} />
          </div>

          <TranslateHindiField
            label={t('womenRoleHiLabel')}
            sourceText={form.women_role}
            value={form.women_role_hi}
            onChange={v => set('women_role_hi', v)}
            multiline
            translateLabel={t('autoTranslateBtn')}
            translatingLabel={t('translatingBtn')}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          {/* History */}
          <div>
            <label style={labelStyle}>{t('historyLabel')}</label>
            <textarea style={{ ...inputStyle, minHeight: 130, resize: 'vertical' } as any}
              value={form.history} onChange={e => set('history', e.target.value)}
              placeholder={t('historyPlaceholder')} />
          </div>

          <TranslateHindiField
            label={t('historyHiLabel')}
            sourceText={form.history}
            value={form.history_hi}
            onChange={v => set('history_hi', v)}
            multiline
            translateLabel={t('autoTranslateBtn')}
            translatingLabel={t('translatingBtn')}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          {/* Image */}
          <div>
            <label style={labelStyle}>{t('imageLabel')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: 8, background: '#FFE8A8', border: '2px solid #DDB840', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2rem' }}>{form.emoji || '🗺️'}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ background: uploading ? '#A07840' : '#1B2E4A', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 8, display: 'block' }}>
                  {uploading ? t('uploading') : t('uploadFromComputer')}
                </button>
                <div style={{ fontSize: '0.75rem', color: '#A07840', marginBottom: 6 }}>{t('imageHelp')}</div>
                <input style={{ ...inputStyle, fontSize: '0.8rem' }} value={form.image_url}
                  onChange={e => set('image_url', e.target.value)} placeholder={t('pasteImageUrlPlaceholder')} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              background: '#E8380A', color: '#fff', padding: '12px 28px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? t('saving') : mode === 'edit' ? t('saveChanges') : t('addGiProductSubmit')}
            </button>
            <button type="button" onClick={() => router.push('/admin/gi-products')} style={{
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
