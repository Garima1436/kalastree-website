'use client'

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: '#',
    bg: '#1877F2',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>
    ),
  },
  {
    name: 'Instagram',
    href: '#',
    bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none"/></svg>
    ),
  },
  {
    name: 'YouTube',
    href: '#',
    bg: '#FF0000',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.39.58A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12C4.49 20.5 12 20.5 12 20.5s7.51 0 9.39-.58a3 3 0 0 0 2.11-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6Z"/></svg>
    ),
  },
  {
    name: 'X',
    href: '#',
    bg: '#000000',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M18.9 2H22l-7.4 8.4L23.3 22h-6.8l-5.3-6.9L5 22H1.9l7.9-9L1 2h6.9l4.8 6.3Zm-1.2 18h1.9L7.4 3.9H5.3Z"/></svg>
    ),
  },
]

export default function SocialBar() {
  return (
    <div style={{ background: '#FDFBF6', borderBottom: '1px solid #EDD060' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '6px 4%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A07840', marginRight: 4 }}>
          Follow Us
        </span>
        {SOCIAL_LINKS.map(({ name, href, bg, icon }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            style={{
              width: 26, height: 26, borderRadius: '50%', background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {icon}
          </a>
        ))}
      </div>
    </div>
  )
}
