import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#1A1A1A', color: '#fff', paddingTop: '3rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5% 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
        {/* Brand */}
        <div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: '#C94B1A', marginBottom: 4 }}>KalaStree</div>
          <div style={{ fontStyle: 'italic', color: '#B8860B', marginBottom: '1rem', fontSize: '0.95rem' }}>"Heritage by Her"</div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
            India's first GI-native, women-first marketplace. Every purchase directly empowers a woman artisan.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(184,134,11,0.2)', paddingTop: '1rem', lineHeight: 1.7 }}>
            🪔 <em>Dedicated to the memory of <strong style={{ color: '#B8860B' }}>Late Shri S.B. Sharma</strong></em>
          </p>
        </div>

        {/* Shop */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '1rem' }}>Shop</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { href: '/shop?category=textile', label: 'Textiles & Silk' },
              { href: '/shop?category=handicraft', label: 'Handicrafts' },
              { href: '/shop?category=agricultural', label: 'Agricultural' },
              { href: '/shop?category=food', label: 'Food & Natural' },
              { href: '/artisans', label: 'Meet the Artisans' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* About */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '1rem' }}>About</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { href: '/about', label: 'Our Mission' },
              { href: '/about#research', label: 'Research' },
              { href: '/join', label: 'Sell on KalaStree' },
              { href: '/about#contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '1rem' }}>Contact</div>
          <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            <p>✉️ <a href="mailto:garima@kalastree.com" style={{ color: '#B8860B', textDecoration: 'none' }}>garima@kalastree.com</a></p>
            <p>🏛️ IIT Patna, CSE Dept.</p>
            <p>🔗 <a href="https://www.linkedin.com/in/iammishu" target="_blank" rel="noopener" style={{ color: '#B8860B', textDecoration: 'none' }}>LinkedIn</a></p>
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem 5%', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>© 2025 KalaStree · All Rights Reserved</span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>IIT Patna · Springer LNNS · ISMS 2025</span>
      </div>

      {/* Folk bottom band */}
      <div style={{ height: 6, background: 'linear-gradient(90deg, #C94B1A, #B8860B, #3B5A2F, #7A3B52, #C94B1A)' }} />
      <style>{`
        @media(max-width:600px){
          .footer-bottom { flex-direction:column !important; align-items:center !important; text-align:center !important; }
        }
      `}</style>
    </footer>
  )
}
