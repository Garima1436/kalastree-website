'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

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
      StarterKit,
      Image,
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
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '8px 12px', color: '#B91C1C', fontSize: '0.8rem', marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div style={{ border: '1.5px solid #DDB840', borderRadius: 6, background: '#FFF8EE' }}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .ProseMirror img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
        .ProseMirror p { margin: 0 0 0.75em; }
        .ProseMirror h2 { font-size: 1.3rem; font-weight: 700; margin: 0.75em 0 0.4em; color: #1B2E4A; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 700; margin: 0.65em 0 0.35em; color: #1B2E4A; }
        .ProseMirror blockquote { border-left: 3px solid #DDB840; padding-left: 12px; color: #6B4820; font-style: italic; margin: 0.5em 0; }
        .ProseMirror ul { padding-left: 1.4em; margin: 0 0 0.75em; }
      `}</style>
    </div>
  )
}
