'use client'
import { SOCIAL_LINKS } from '@/lib/socialLinks'
import LanguageSwitcher from './LanguageSwitcher'

export default function SocialBar() {
  return (
    <div style={{ background: '#FDFBF6', borderBottom: '1px solid #EDD060' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '3px 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <LanguageSwitcher tiny />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A07840', marginRight: 2 }}>
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
              width: 19, height: 19, borderRadius: '50%', background: bg,
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
    </div>
  )
}
