import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

// Job descriptions are written by admins as light Markdown: **bold**, ## headings,
// - bullet lists. react-markdown renders to React elements and escapes any raw HTML,
// so an admin (or a compromised admin account) can't inject scripts through this
// field. Images are blocked; unsafe link protocols (javascript:) are stripped by
// react-markdown's default URL handling.

const Heading = ({ children }: { children?: React.ReactNode }) => (
  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1B2E4A', margin: '1.1rem 0 0.4rem' }}>{children}</h4>
)

const components: Components = {
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  p: ({ children }) => <p style={{ margin: '0 0 0.6rem' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '0 0 0.6rem', paddingLeft: '1.25rem', listStyle: 'disc' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 0.6rem', paddingLeft: '1.25rem' }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#1B2E4A' }}>{children}</strong>,
}

export default function JobDescription({ text }: { text: string }) {
  return (
    <ReactMarkdown components={components} disallowedElements={['img']} unwrapDisallowed>
      {text}
    </ReactMarkdown>
  )
}
