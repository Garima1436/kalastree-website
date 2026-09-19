'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import TranslateHindiField from '@/components/TranslateHindiField'
import JobDescription from '@/components/JobDescription'
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPES, type JobOpening } from '@/lib/careers'

interface Props {
  initialData?: JobOpening
  mode?: 'new' | 'edit'
}

export default function OpeningForm({ initialData, mode = 'new' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    title_hi: initialData?.title_hi ?? '',
    location: initialData?.location ?? '',
    employment_type: initialData?.employment_type ?? 'full_time',
    description: initialData?.description ?? '',
    description_hi: initialData?.description_hi ?? '',
    is_active: initialData?.is_active ?? true,
  })

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))

  const descRef = useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Inserts Markdown around the selection so admins never have to type the symbols.
  // Heading/bullet act on whole lines, and pressing again on already-formatted lines removes it.
  const format = (kind: 'bold' | 'heading' | 'bullet') => {
    const el = descRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end, value } = el
    let next: string
    let selStart: number
    let selEnd: number

    if (kind === 'bold') {
      const inner = value.slice(start, end) || 'bold text'
      next = value.slice(0, start) + `**${inner}**` + value.slice(end)
      selStart = start + 2
      selEnd = selStart + inner.length
    } else {
      const prefix = kind === 'heading' ? '## ' : '- '
      const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1
      const lineEndIdx = value.indexOf('\n', end)
      const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx
      const lines = value.slice(lineStart, lineEnd).split('\n')
      const allPrefixed = lines.every(l => !l.trim() || l.startsWith(prefix))
      const block = lines
        .map(l => (!l.trim() ? l : allPrefixed ? l.slice(prefix.length) : l.startsWith(prefix) ? l : prefix + l))
        .join('\n')
      next = value.slice(0, lineStart) + block + value.slice(lineEnd)
      selStart = lineStart
      selEnd = lineStart + block.length
    }

    set('description', next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(selStart, selEnd) })
  }

  const toolbarButton: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: '#1B2E4A', background: '#FFF8EE',
    border: '1.5px solid #DDB840', borderRadius: 5, padding: '4px 12px', cursor: 'pointer',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const isEdit = mode === 'edit' && initialData?.id
    const res = await fetch('/api/admin/careers', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: initialData.id, ...form } : form),
    })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) { setError(result.error ?? 'Failed to save'); setLoading(false) }
    else { router.push('/admin/careers'); router.refresh() }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/admin/careers')} style={{ background: 'none', border: 'none', color: '#6B4820', cursor: 'pointer', fontSize: '0.88rem' }}>
          ← Back to Careers
        </button>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {mode === 'edit' ? 'Edit Position' : 'Add Position'}
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
            <label style={labelStyle}>Job Title</label>
            <input style={inputStyle} required maxLength={120} value={form.title}
              onChange={e => set('title', e.target.value)} placeholder="Marketing Associate" />
          </div>

          <TranslateHindiField
            label="Job Title (Hindi, optional)"
            sourceText={form.title}
            value={form.title_hi}
            onChange={v => set('title_hi', v)}
            translateLabel="Auto-translate"
            translatingLabel="Translating..."
            hint="Shown when the Careers page is viewed in Hindi. If left empty, the English title is shown."
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          <div className="opening-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input style={inputStyle} required maxLength={120} value={form.location}
                onChange={e => set('location', e.target.value)} placeholder="Patna, Bihar — or Remote" />
            </div>
            <div>
              <label style={labelStyle}>Employment Type</label>
              <select style={inputStyle} value={form.employment_type} onChange={e => set('employment_type', e.target.value)}>
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{EMPLOYMENT_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => format('bold')} style={{ ...toolbarButton, fontWeight: 800 }} title="Make the selected text bold">B  Bold</button>
              <button type="button" onClick={() => format('heading')} style={toolbarButton} title="Turn the selected line(s) into a bold section heading">Heading</button>
              <button type="button" onClick={() => format('bullet')} style={toolbarButton} title="Turn the selected line(s) into bullet points">• Bullets</button>
              <button type="button" onClick={() => setShowPreview(v => !v)} style={{ ...toolbarButton, marginLeft: 'auto', color: '#1A7A32', borderColor: '#1A7A32' }}>
                {showPreview ? 'Hide preview' : 'Preview'}
              </button>
            </div>
            <textarea ref={descRef} style={{ ...inputStyle, minHeight: 240, resize: 'vertical' }} required maxLength={3000}
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="What the role involves, what you are looking for…" />
            <p style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4, lineHeight: 1.6 }}>
              Select text and use the buttons above, or type it: <code>**bold**</code>, <code>## Heading</code>, <code>- bullet</code>.
              Leave a blank line between paragraphs and after a heading. Up to 3000 characters.
            </p>
            {showPreview && (
              <div style={{ marginTop: 10, border: '1.5px dashed #DDB840', borderRadius: 8, padding: '1rem 1.25rem', background: '#FFFDF7', color: '#6B4820', lineHeight: 1.7, fontSize: '0.95rem' }}>
                {form.description.trim()
                  ? <JobDescription text={form.description} />
                  : <span style={{ color: '#A07840' }}>Nothing to preview yet.</span>}
              </div>
            )}
          </div>

          <TranslateHindiField
            label="Description (Hindi, optional)"
            sourceText={form.description}
            value={form.description_hi}
            onChange={v => set('description_hi', v)}
            multiline
            translateLabel="Auto-translate"
            translatingLabel="Translating..."
            hint="Shown when the Careers page is viewed in Hindi. If left empty, the English description is shown. Auto-translate keeps the bold, headings and bullets."
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#1B2E4A', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
            Show this position on the Careers page
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} style={{
              background: '#E8380A', color: '#fff', padding: '12px 28px',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Position'}
            </button>
            <button type="button" onClick={() => router.push('/admin/careers')} style={{
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
          .opening-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
