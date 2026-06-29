'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import CartIcon from './CartIcon'
import { createClient } from '@/lib/supabase-browser'

const NAV_LINKS = [
  { href: '/artisans', label: 'Artisans' },
  { href: '/about', label: 'About Us' },
  { href: '/gi-products', label: 'GI Products' },
]

const SHOP_CATEGORIES = [
  { href: '/shop?category=textile', label: 'Textiles & Silk', icon: '🧵' },
  { href: '/shop?category=handicraft', label: 'Handicrafts', icon: '🏺' },
  { href: '/shop?category=agricultural', label: 'Agricultural', icon: '🌾' },
  { href: '/shop?category=food', label: 'Food & Natural', icon: '🍯' },
]

const SHOP_STATES = [
  'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Kashmir',
  'Bihar', 'Odisha', 'Punjab', 'Kerala',
  'Tamil Nadu', 'Gujarat', 'Madhya Pradesh', 'Karnataka',
]

const TICKER_ITEMS = [
  'PhD Scholar — IIT Patna', 'GI Products Advocate', 'Women Empowerment',
  'FinTech & Heritage', 'KalaStree — Heritage by Her', '478 GI Tags Analyzed',
  '16 States Surveyed', '2,500 Women Voices', 'Madhubani · Pashmina · Banarasi · Kanchipuram',
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [shopDropdown, setShopDropdown] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const shopRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false)
      }
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const applySession = (session: any) => {
      const u = session?.user ?? null
      setUser(u)
      setIsAdmin(u?.user_metadata?.role === 'admin')
    }

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    // Back up current cart under this user's own key before signing out
    if (user?.id) {
      const cart = localStorage.getItem('kalastree_cart')
      if (cart && JSON.parse(cart).length > 0) {
        localStorage.setItem(`kalastree_cart_${user.id}`, cart)
      }
    }
    localStorage.removeItem('kalastree_cart')
    localStorage.removeItem('kalastree_cart_owner')
    window.dispatchEvent(new Event('cart_updated'))
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    window.location.href = '/'
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(253,246,227,0.97)' : 'rgba(253,246,227,1)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid #D9C9A8',
        boxShadow: scrolled ? '0 2px 20px rgba(26,10,0,0.08)' : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/gi-logo.png" alt="KalaStree logo" width={44} height={44} style={{ objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.55rem', fontWeight: 700, color: '#C94B1A', letterSpacing: '-0.5px' }}>
              Kala<span style={{ color: '#B8860B', fontStyle: 'italic' }}>Stree</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="nav-desktop" style={{ display: 'flex', gap: '0.15rem', listStyle: 'none', alignItems: 'center', flexWrap: 'nowrap' }}>
            <li><Link href="/" className="nav-link">Home</Link></li>
            {/* Shop dropdown */}
            <li ref={shopRef} style={{ position: 'relative' }}>
              <button onClick={() => setShopDropdown(v => !v)}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Shop <span style={{ fontSize: '0.55rem', marginTop: 1 }}>{shopDropdown ? '▲' : '▼'}</span>
              </button>
              {shopDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, boxShadow: '0 12px 40px rgba(26,10,0,0.14)', zIndex: 300, minWidth: 480, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
                  {/* By Category */}
                  <div style={{ padding: '1.25rem 1.5rem', borderRight: '1px solid #EDE0C8' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '0.75rem' }}>Shop by Category</div>
                    {SHOP_CATEGORIES.map(({ href, label, icon }) => (
                      <Link key={href} href={href} onClick={() => setShopDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', textDecoration: 'none', borderBottom: '1px solid #F2E8D5', color: '#1B2E4A', fontSize: '0.88rem', fontWeight: 600, fontFamily: "'Lato', sans-serif" }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#C94B1A')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#1B2E4A')}>
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    <Link href="/shop" onClick={() => setShopDropdown(false)}
                      style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#C94B1A', textDecoration: 'none' }}>
                      View All Products →
                    </Link>
                  </div>
                  {/* By State */}
                  <div style={{ padding: '1.25rem 1.5rem', background: '#FDFAF5' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '0.75rem' }}>Shop by State</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                      {SHOP_STATES.map(state => (
                        <Link key={state} href={`/shop?state=${encodeURIComponent(state)}`} onClick={() => setShopDropdown(false)}
                          style={{ padding: '5px 0', textDecoration: 'none', color: '#5C5542', fontSize: '0.82rem', fontFamily: "'Lato', sans-serif", whiteSpace: 'nowrap' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#C94B1A')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#5C5542')}>
                          {state}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>

            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="nav-link">{label}</Link>
              </li>
            ))}
            <li><Link href="/about#contact" className="nav-cta">Contact</Link></li>
            <li style={{ marginLeft: '0.5rem' }}><CartIcon /></li>

            {user ? (
              <li style={{ position: 'relative' }} ref={dropdownRef}>
                <button onClick={() => setUserDropdown(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px solid #D9C9A8', borderRadius: 24, padding: '5px 14px 5px 6px', cursor: 'pointer', fontFamily: "'Lato', sans-serif" }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #C94B1A, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(user.user_metadata?.full_name || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1B2E4A', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(user.user_metadata?.full_name || user.email).split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#9A8E7A' }}>{userDropdown ? '▲' : '▼'}</span>
                </button>

                {userDropdown && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 10, boxShadow: '0 8px 32px rgba(26,10,0,0.12)', minWidth: 200, zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #EDE0C8', background: '#F8F2E8' }}>
                      <div style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#1B2E4A' }}>{user.user_metadata?.full_name || 'User'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9A8E7A', marginTop: 2 }}>{user.email}</div>
                    </div>
                    {[
                      { href: '/account/profile', icon: '👤', label: 'My Profile' },
                      { href: '/account/orders', icon: '📦', label: 'My Orders' },
                    ].map(({ href, icon, label }) => (
                      <Link key={href} href={href} onClick={() => setUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: '#1B2E4A', textDecoration: 'none', borderBottom: '1px solid #F2E8D5' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F2E8D5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#B8860B', textDecoration: 'none', borderBottom: '1px solid #F2E8D5', background: '#FFFBF0' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9F0D0')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#FFFBF0')}>
                        <span>⚙️</span>Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%', background: 'none', border: 'none', fontFamily: "'Lato', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: '#C94B1A', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span>🚪</span>Sign Out
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li style={{ display: 'flex', gap: 8 }}>
                <Link href="/login" style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'none', border: '1.5px solid #D9C9A8', color: '#5C5542', padding: '6px 14px', borderRadius: 4, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Sign In
                </Link>
                <Link href="/signup" style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: '#C94B1A', color: '#fff', padding: '6px 14px', borderRadius: 4, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Sign Up
                </Link>
              </li>
            )}
          </ul>

          {/* Mobile right */}
          <div className="nav-mobile-right" style={{ display: 'none', alignItems: 'center', gap: 12 }}>
            <CartIcon />
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Menu">
              {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 24, height: 2, background: '#C94B1A', borderRadius: 2 }} />)}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: 'rgba(253,246,227,0.99)', borderTop: '1px solid #D9C9A8', padding: '1.25rem 5%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Link href="/" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#1B2E4A', textDecoration: 'none', fontSize: '0.95rem', letterSpacing: '0.04em', padding: '4px 0', borderBottom: '1px solid #EDE0C8' }}>
              Home
            </Link>
            {/* Shop expandable */}
            <div>
              <button onClick={() => setMobileShopOpen(v => !v)}
                style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#1B2E4A', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #EDE0C8', cursor: 'pointer' }}>
                Shop <span style={{ fontSize: '0.7rem', color: '#9A8E7A' }}>{mobileShopOpen ? '▲' : '▼'}</span>
              </button>
              {mobileShopOpen && (
                <div style={{ paddingTop: '0.75rem', paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginBottom: 2 }}>By Category</div>
                  {SHOP_CATEGORIES.map(({ href, label, icon }) => (
                    <Link key={href} href={href} onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                      style={{ fontFamily: "'Lato', sans-serif", color: '#1B2E4A', textDecoration: 'none', fontSize: '0.88rem', padding: '3px 0' }}>
                      {icon} {label}
                    </Link>
                  ))}
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', marginTop: '0.5rem', marginBottom: 2 }}>By State</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                    {SHOP_STATES.map(state => (
                      <Link key={state} href={`/shop?state=${encodeURIComponent(state)}`} onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                        style={{ color: '#5C5542', textDecoration: 'none', fontSize: '0.82rem', fontFamily: "'Lato', sans-serif" }}>
                        {state}
                      </Link>
                    ))}
                  </div>
                  <Link href="/shop" onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                    style={{ color: '#C94B1A', fontWeight: 700, textDecoration: 'none', fontSize: '0.82rem', marginTop: 4 }}>
                    View All →
                  </Link>
                </div>
              )}
            </div>

            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#1B2E4A', textDecoration: 'none', fontSize: '0.95rem', letterSpacing: '0.04em', padding: '4px 0', borderBottom: '1px solid #EDE0C8' }}>
                {label}
              </Link>
            ))}
            <Link href="/about#contact" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#fff', background: '#C94B1A', textDecoration: 'none', fontSize: '0.95rem', padding: '8px 14px', borderRadius: 4, textAlign: 'center' }}>
              Contact
            </Link>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #EDE0C8' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C94B1A, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                    {(user.user_metadata?.full_name || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1B2E4A' }}>{user.user_metadata?.full_name || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9A8E7A' }}>{user.email}</div>
                  </div>
                </div>
                <Link href="/account/profile" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#1B2E4A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #EDE0C8' }}>
                  👤 My Profile
                </Link>
                <Link href="/account/orders" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#1B2E4A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #EDE0C8' }}>
                  📦 My Orders
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#B8860B', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #EDE0C8' }}>
                    ⚙️ Admin Panel
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                  style={{ background: 'none', border: 'none', fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#C94B1A', fontSize: '0.95rem', padding: '4px 0', textAlign: 'left', cursor: 'pointer' }}>
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#1B2E4A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #EDE0C8' }}>
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, color: '#C94B1A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0' }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Ticker */}
      <div style={{ background: '#1B2E4A', padding: '7px 0', overflow: 'hidden', borderBottom: '2px solid #B8860B' }}>
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8860B', padding: '0 2rem', whiteSpace: 'nowrap' }}>
              {i !== 0 ? <><span style={{ color: '#C94B1A', padding: '0 0.5rem' }}>◆</span>{item}</> : item}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .nav-link { font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#5C5542;text-decoration:none;padding:5px 8px;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s;white-space:nowrap; }
        .nav-link:hover { color:#C94B1A;border-bottom-color:#C94B1A; }
        .nav-cta { font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;background:#C94B1A;color:#fff!important;padding:7px 16px;border-radius:4px;text-decoration:none;white-space:nowrap;transition:background 0.2s; }
        .nav-cta:hover { background:#8B3010; }
        .ticker-track { display:flex;white-space:nowrap;animation:ticker 40s linear infinite; }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @media(max-width:768px) { .nav-desktop{display:none!important;} .nav-mobile-right{display:flex!important;} }
      `}</style>
    </>
  )
}
