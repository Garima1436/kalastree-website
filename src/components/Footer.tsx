'use client'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
    <footer style={{ background: '#1A1A1A', color: '#fff', paddingTop: '3rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5% 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
        {/* Brand */}
        <div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: '#E8380A', marginBottom: 4 }}>KalaStree</div>
          <div style={{ fontStyle: 'italic', color: '#D4A000', marginBottom: '1rem', fontSize: '0.95rem' }}>{tFooter('tagline')}</div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
            {tFooter('brandBlurb')}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(212,160,0,0.2)', paddingTop: '1rem', lineHeight: 1.7 }}>
            🪔 <em>{tFooter('dedication')}</em>
          </p>
        </div>

        {/* Shop */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{tFooter('shopHeading')}</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shopLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{label}</Link>
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
                <Link href={href} style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{tFooter('contactHeading')}</div>
          <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            <p>✉️ <a href="mailto:garima@kalastree.com" style={{ color: '#D4A000', textDecoration: 'none' }}>garima@kalastree.com</a></p>
            <p>🏛️ {tFooter('instituteLine')}</p>
            <p>🔗 <a href="https://www.linkedin.com/in/iammishu" target="_blank" rel="noopener" style={{ color: '#D4A000', textDecoration: 'none' }}>LinkedIn</a></p>
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem 5%', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{tFooter('copyright')}</span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{tFooter('publication')}</span>
      </div>

      {/* Folk bottom band */}
      <div style={{ height: 6, background: 'linear-gradient(90deg, #E8380A, #D4A000, #1A7A32, #C21859, #E8380A)' }} />
      <style>{`
        @media(max-width:600px){
          .footer-bottom { flex-direction:column !important; align-items:center !important; text-align:center !important; }
        }
      `}</style>
    </footer>
  )
}
