'use client'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BaseImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import ImageResizeView from './ImageResizeView'

// Adds a resizable `width` attribute (as a % of the container) to inline
// images, stored directly as the <img>'s inline style — so it's part of
// the saved HTML and renders correctly wherever that HTML is shown (the
// editor here, the article detail page, etc.) with no extra data needed.
// The custom NodeView (ImageResizeView) adds a drag handle for free-form
// resizing; the size-preset toolbar buttons below set the same attribute.
const ResizableImage = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element: HTMLElement) => element.style.width || '100%',
        renderHTML: () => ({}), // combined into one style string below
      },
      // 'none' keeps the image on its own line (current behavior); 'left'/
      // 'right' floats it so paragraph text wraps around the other side.
      float: {
        default: 'none',
        parseHTML: (element: HTMLElement) => element.style.float || 'none',
        renderHTML: () => ({}),
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { width, float, ...rest } = HTMLAttributes
    const margin = float === 'left' ? '0 1.25em 0.75em 0' : float === 'right' ? '0 0 0.75em 1.25em' : '0'
    const style = `width: ${width || '100%'}; float: ${float || 'none'}; margin: ${margin};`
    return ['img', { ...rest, style }]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView)
  },
})

const IMAGE_FLOATS: { label: string; value: string }[] = [
  { label: '⇤ Left', value: 'left' },
  { label: '▬ None', value: 'none' },
  { label: 'Right ⇥', value: 'right' },
]

const IMAGE_SIZES: { label: string; value: string }[] = [
  { label: 'S', value: '33%' },
  { label: 'M', value: '50%' },
  { label: 'L', value: '75%' },
  { label: 'Full', value: '100%' },
]

interface Props {
  value: string
  onChange: (html: string) => void
  // Supabase Storage bucket inline-inserted images upload to.
  storageBucket: string
}

export default function RichTextEditor({ value, onChange, storageBucket }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit bundles its own Link extension by default, which
      // collides with the explicitly configured one below (TipTap logs
      // "Duplicate extension names found: ['link']") — disable StarterKit's.
      StarterKit.configure({ link: false }),
      ResizableImage,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: 'min-height: 220px; padding: 12px 14px; outline: none;',
      },
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }

    setUploading(true)
    setError('')
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()}`

    const { error: uploadError } = await supabase.storage
      .from(storageBucket).upload(fileName, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
    } else {
      const { data: { publicUrl } } = supabase.storage.from(storageBucket).getPublicUrl(fileName)
      editor.chain().focus().setImage({ src: publicUrl }).run()
    }
    setUploading(false)
  }

  if (!editor) return null

  const toolbarBtn = (active: boolean): React.CSSProperties => ({
    background: active ? '#1B2E4A' : 'none',
    color: active ? '#fff' : '#6B4820',
    border: '1px solid #DDB840',
    borderRadius: 4,
    padding: '5px 10px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
  })

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={toolbarBtn(editor.isActive('bold'))}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={toolbarBtn(editor.isActive('italic'))}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={toolbarBtn(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={toolbarBtn(editor.isActive('heading', { level: 3 }))}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={toolbarBtn(editor.isActive('bulletList'))}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={toolbarBtn(editor.isActive('blockquote'))}>&ldquo;Quote&rdquo;</button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={toolbarBtn(false)}>
          {uploading ? 'Uploading...' : '🖼 Insert Image'}
        </button>
      </div>
      {editor.isActive('image') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8, padding: '6px 10px', background: '#FFE8A8', borderRadius: 6, width: 'fit-content' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B4820' }}>Image size:</span>
          {IMAGE_SIZES.map(({ label, value }) => (
            <button key={value} type="button"
              onClick={() => editor.chain().focus().updateAttributes('image', { width: value }).run()}
              style={toolbarBtn(editor.getAttributes('image').width === value)}>
              {label}
            </button>
          ))}
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B4820', marginLeft: 10 }}>Wrap text:</span>
          {IMAGE_FLOATS.map(({ label, value }) => (
            <button key={value} type="button"
              onClick={() => editor.chain().focus().updateAttributes('image', { float: value }).run()}
              style={toolbarBtn((editor.getAttributes('image').float || 'none') === value)}>
              {label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '8px 12px', color: '#B91C1C', fontSize: '0.8rem', marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div style={{ border: '1.5px solid #DDB840', borderRadius: 6, background: '#FFF8EE' }}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        /* Image sizing/selection is handled inline by ImageResizeView's NodeView. */
        .ProseMirror p { margin: 0 0 0.75em; }
        .ProseMirror h2 { font-size: 1.3rem; font-weight: 700; margin: 0.75em 0 0.4em; color: #1B2E4A; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 700; margin: 0.65em 0 0.35em; color: #1B2E4A; }
        .ProseMirror blockquote { border-left: 3px solid #DDB840; padding-left: 12px; color: #6B4820; font-style: italic; margin: 0.5em 0; }
        .ProseMirror ul { padding-left: 1.4em; margin: 0 0 0.75em; }
      `}</style>
    </div>
  )
}
