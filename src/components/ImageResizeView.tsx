'use client'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useRef, useState } from 'react'

// Drag-to-resize handle for inline images in the article editor. Width is
// stored as a % of the editor's content width (see RichTextEditor.tsx's
// ResizableImage extension) so it stays correct across screen sizes and
// survives round-tripping through the saved HTML unchanged.
export default function ImageResizeView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    // Without this, the mousedown bubbles up to ProseMirror's own
    // data-drag-handle listener (see below) and it tries to start moving
    // the whole image at the same time as this resize drag.
    e.stopPropagation()
    const wrapper = wrapperRef.current
    const container = wrapper?.parentElement
    if (!wrapper || !container) return

    const startX = e.clientX
    const startWidthPx = wrapper.getBoundingClientRect().width
    const containerWidthPx = container.getBoundingClientRect().width

    setDragging(true)

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const newWidthPx = startWidthPx + deltaX
      // Clamp between 10% and 100% of the content column.
      const percent = Math.min(100, Math.max(10, (newWidthPx / containerWidthPx) * 100))
      updateAttributes({ width: `${percent.toFixed(1)}%` })
    }
    const onMouseUp = () => {
      setDragging(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Mirrors the margin logic in RichTextEditor.tsx's renderHTML, so the
  // live editing view matches the final saved/rendered output.
  const float = node.attrs.float || 'none'
  const margin = float === 'left' ? '0 1.25em 0.75em 0' : float === 'right' ? '0 0 0.75em 1.25em' : '0'

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      as="span"
      // draggable + data-drag-handle let ProseMirror's own node-move drag
      // (click the image, drag it to a new position in the text) work —
      // the base Image node's schema has draggable:true, but a custom
      // NodeView doesn't inherit that automatically; without these two,
      // dragging the image to reposition it is actively blocked (verified
      // in @tiptap/core's NodeView.stopEvent).
      draggable
      data-drag-handle
      style={{
        display: float === 'none' ? 'inline-block' : 'block',
        position: 'relative',
        width: node.attrs.width || '100%',
        float: float as 'left' | 'right' | 'none',
        margin,
        lineHeight: 0,
      }}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        draggable={false}
        style={{
          width: '100%', height: 'auto', display: 'block', borderRadius: 6,
          outline: selected ? '2px solid #E8380A' : 'none',
          cursor: 'grab',
        }}
      />
      {selected && (
        <>
          <span
            onMouseDown={startDrag}
            style={{
              position: 'absolute', right: -6, bottom: -6,
              width: 14, height: 14, borderRadius: '50%',
              background: '#E8380A', border: '2px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              cursor: 'nwse-resize',
            }}
          />
          <button
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => deleteNode()}
            title="Remove image"
            style={{
              position: 'absolute', top: -8, right: -8,
              width: 20, height: 20, borderRadius: '50%',
              background: '#1B2E4A', color: '#fff', border: '2px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              fontSize: '0.7rem', lineHeight: 1, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            ✕
          </button>
        </>
      )}
      {dragging && (
        <span style={{
          position: 'absolute', top: 4, left: 4,
          background: 'rgba(27,46,74,0.85)', color: '#fff',
          fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
        }}>
          {node.attrs.width}
        </span>
      )}
    </NodeViewWrapper>
  )
}
