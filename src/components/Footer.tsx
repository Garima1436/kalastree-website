'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { SOCIAL_LINKS } from '@/lib/socialLinks'

export default function Footer() {
  const { t: tCommon } = useTranslation('common')
  const { t: tFooter } = useTranslation('footer')

  const shopLinks = [
    { href: '/shop?category=textile', label: tCommon('textilesAndSilk') },
    { href: '/shop?category=handicraft', label: tCommon('handicrafts') },
    { href: '/shop?category=agricultural', label: tCommon('agricultural') },
    { href: '/shop?category=food', label: tCommon('foodAndNatural') },
    { href: '/artisans', label: tFooter('meetArtisans') },
  ]

  const aboutLinks = [
    { href: '/about', label: tFooter('ourMission') },
    { href: '/about#research', label: tFooter('research') },
    { href: '/about#our-story', label: tFooter('ourStory') },
    { href: '/join', label: tFooter('sellOnKalastree') },
    { href: '/about#contact', label: tCommon('contact') },
  ]

  return (
    <footer style={{ background: '#000000', color: '#fff', paddingTop: '3rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5% 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
        {/* Brand */}
        <div>
          <Image src="/kalastree-logo.png" alt={`KalaStree — ${tFooter('tagline')}`} width={220} height={120} style={{ height: 70, width: 'auto', objectFit: 'contain', marginBottom: '1rem' }} />
          <p style={{ fontSize: '0.85rem', lineHeight: 1.75, color: '#fff', marginBottom: '1rem' }}>
            {tFooter('brandBlurb')}
          </p>
          <p style={{ fontSize: '0.78rem', color: '#fff', borderTop: '1px solid rgba(212,160,0,0.2)', paddingTop: '1rem', lineHeight: 1.7 }}>
            🪔 <em>{tFooter('dedication')}</em>
          </p>
        </div>

        {/* Shop */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{tFooter('shopHeading')}</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shopLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="footer-link" style={{ fontSize: '0.88rem', color: '#fff', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* About */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{tFooter('aboutHeading')}</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aboutLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="footer-link" style={{ fontSize: '0.88rem', color: '#fff', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{tFooter('contactHeading')}</div>
          <div style={{ fontSize: '0.88rem', color: '#fff', lineHeight: 1.8 }}>
            <p>✉️ <a href="mailto:garima@kalastree.com" className="footer-link" style={{ color: '#fff', textDecoration: 'none' }}>garima@kalastree.com</a></p>
            <p>🏛️ {tFooter('instituteLine')}</p>
            <p>🔗 <a href="https://www.linkedin.com/in/iammishu" target="_blank" rel="noopener" className="footer-link" style={{ color: '#fff', textDecoration: 'none' }}>LinkedIn</a></p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
            {SOCIAL_LINKS.map(({ name, href, bg, icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="footer-social-icon"
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem 5%', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#fff' }}>{tFooter('copyright')}</span>
        <span style={{ fontSize: '0.8rem', color: '#fff' }}>{tFooter('publication')}</span>
      </div>

      {/* Folk bottom band */}
      <div style={{ height: 6, background: 'linear-gradient(90deg, #E8380A, #D4A000, #1A7A32, #C21859, #E8380A)' }} />
      <style>{`
        .footer-link { transition: color 0.2s; }
        .footer-link:hover { color: #1B2E4A !important; }
        .footer-social-icon { transition: transform 0.15s; }
        .footer-social-icon:hover { transform: scale(1.12); }
        @media(max-width:600px){
          .footer-bottom { flex-direction:column !important; align-items:center !important; text-align:center !important; }
        }
      `}</style>
    </footer>
  )
}
