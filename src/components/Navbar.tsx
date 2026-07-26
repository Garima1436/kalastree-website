'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import CartIcon from './CartIcon'
import NavSearch from './NavSearch'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function Navbar() {
  const { t: tCommon } = useTranslation('common')
  const { t: tNav } = useTranslation('nav')

  const NAV_LINKS = [
    { href: '/artisans', label: tCommon('artisans') },
    { href: '/gi-products', label: tCommon('giProducts') },
    { href: '/about', label: tCommon('aboutUs') },
  ]

  const SHOP_CATEGORIES = [
    { href: '/shop?category=textile', label: tCommon('textilesAndSilk'), icon: '🧵' },
    { href: '/shop?category=handicraft', label: tCommon('handicrafts'), icon: '🏺' },
    { href: '/shop?category=agricultural', label: tCommon('agricultural'), icon: '🌾' },
    { href: '/shop?category=food', label: tCommon('foodAndNatural'), icon: '🍯' },
  ]

  const SHOP_STATES = [
    tNav('stateRajasthan'), tNav('stateUttarPradesh'), tNav('stateWestBengal'), tNav('stateKashmir'),
    tNav('stateBihar'), tNav('stateOdisha'), tNav('statePunjab'), tNav('stateKerala'),
    tNav('stateTamilNadu'), tNav('stateGujarat'), tNav('stateMadhyaPradesh'), tNav('stateKarnataka'),
  ]

  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [shopDropdown, setShopDropdown] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isArtisan, setIsArtisan] = useState(false)
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

    const applySession = async (session: any) => {
      const u = session?.user ?? null
      setUser(u)
      if (u?.id) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).single()
        setIsAdmin(profile?.role === 'admin')
        setIsArtisan(profile?.role === 'artisan')
      } else {
        setIsAdmin(false)
        setIsArtisan(false)
      }
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
        background: scrolled ? 'rgba(245,247,246,0.97)' : 'rgba(245,247,246,1)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid #C7D2D6',
        boxShadow: scrolled ? '0 2px 20px rgba(13,31,38,0.08)' : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/kalastree_l3.png" alt="KalaStree" width={90} height={90} style={{ objectFit: 'contain', height: 80, width: 'auto' }} priority />
          </Link>

          {/* Desktop nav */}
          <ul className="nav-desktop" style={{ display: 'flex', gap: '0.15rem', listStyle: 'none', alignItems: 'center', flexWrap: 'nowrap' }}>
            <li><Link href="/" className="nav-link">{tCommon('home')}</Link></li>
            {/* Shop dropdown */}
            <li ref={shopRef} style={{ position: 'relative' }}>
              <button onClick={() => setShopDropdown(v => !v)}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {tCommon('shop')} <span style={{ fontSize: '0.55rem', marginTop: 1 }}>{shopDropdown ? '▲' : '▼'}</span>
              </button>
              {shopDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, background: '#FFFFFF', border: '1.5px solid #C7D2D6', borderRadius: 12, boxShadow: '0 12px 40px rgba(13,31,38,0.14)', zIndex: 300, minWidth: 480, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
                  {/* By Category */}
                  <div style={{ padding: '1.25rem 1.5rem', borderRight: '1px solid #DCE4E6' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1E5F74', marginBottom: '0.75rem' }}>{tCommon('shopByCategory')}</div>
                    {SHOP_CATEGORIES.map(({ href, label, icon }) => (
                      <Link key={href} href={href} onClick={() => setShopDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', textDecoration: 'none', borderBottom: '1px solid #E3ECEE', color: '#16303A', fontSize: '0.88rem', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1E5F74')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#16303A')}>
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    <Link href="/shop" onClick={() => setShopDropdown(false)}
                      style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#1E5F74', textDecoration: 'none' }}>
                      {tCommon('viewAllProducts')} →
                    </Link>
                  </div>
                  {/* By State */}
                  <div style={{ padding: '1.25rem 1.5rem', background: '#EEF2F2' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1E5F74', marginBottom: '0.75rem' }}>{tCommon('shopByState')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                      {SHOP_STATES.map(state => (
                        <Link key={state} href={`/shop?state=${encodeURIComponent(state)}`} onClick={() => setShopDropdown(false)}
                          style={{ padding: '5px 0', textDecoration: 'none', color: '#5B7480', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#1E5F74')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#5B7480')}>
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
            <li><Link href="/about#contact" className="nav-cta">{tCommon('contact')}</Link></li>
            <li style={{ marginLeft: '0.25rem' }}>
              <button onClick={() => setSearchOpen(true)} aria-label="Search"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'none', border: '1.5px solid #C7D2D6', borderRadius: 8, cursor: 'pointer', color: '#5B7480', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1E5F74'; e.currentTarget.style.color = '#1E5F74' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#C7D2D6'; e.currentTarget.style.color = '#5B7480' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </li>
            <li style={{ marginLeft: '0.25rem' }}><CartIcon /></li>

            {user ? (
              <li style={{ position: 'relative' }} ref={dropdownRef}>
                <button onClick={() => setUserDropdown(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px solid #C7D2D6', borderRadius: 24, padding: '5px 14px 5px 6px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1E5F74, #1E5F74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(user.user_metadata?.full_name || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16303A', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(user.user_metadata?.full_name || user.email).split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#7C93A0' }}>{userDropdown ? '▲' : '▼'}</span>
                </button>

                {userDropdown && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#FFFFFF', border: '1.5px solid #C7D2D6', borderRadius: 10, boxShadow: '0 8px 32px rgba(13,31,38,0.12)', minWidth: 200, zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #DCE4E6', background: '#EEF2F2' }}>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#16303A' }}>{user.user_metadata?.full_name || 'User'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#7C93A0', marginTop: 2 }}>{user.email}</div>
                    </div>
                    {[
                      { href: '/account/profile', icon: '👤', label: tCommon('myProfile') },
                      { href: '/account/orders', icon: '📦', label: tCommon('myOrders') },
                    ].map(({ href, icon, label }) => (
                      <Link key={href} href={href} onClick={() => setUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: '#16303A', textDecoration: 'none', borderBottom: '1px solid #E3ECEE' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#E3ECEE')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    {isArtisan && (
                      <Link href="/artisan" onClick={() => setUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#1A7A32', textDecoration: 'none', borderBottom: '1px solid #E3ECEE', background: '#F0FFF4' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#C8F5D8')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#F0FFF4')}>
                        <span>🎨</span>{tCommon('artisanPanel')}
                      </Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#1E5F74', textDecoration: 'none', borderBottom: '1px solid #E3ECEE', background: '#EEF2F2' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#DCE4E6')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#EEF2F2')}>
                        <span>⚙️</span>{tCommon('adminPanel')}
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: '#1E5F74', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#E3ECEE')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span>🚪</span>{tCommon('signOut')}
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li>
                <Link href="/login" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: '#1E5F74', color: '#fff', padding: '6px 14px', borderRadius: 4, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {tCommon('signIn')}
                </Link>
              </li>
            )}
          </ul>

          {/* Mobile right */}
          <div className="nav-mobile-right" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSearchOpen(true)} aria-label="Search"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', color: '#5B7480' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <CartIcon />
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Menu">
              {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 24, height: 2, background: '#1E5F74', borderRadius: 2 }} />)}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: 'rgba(245,247,246,0.99)', borderTop: '1px solid #C7D2D6', padding: '1.25rem 5%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Link href="/" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#16303A', textDecoration: 'none', fontSize: '0.95rem', letterSpacing: '0.04em', padding: '4px 0', borderBottom: '1px solid #DCE4E6' }}>
              {tCommon('home')}
            </Link>
            {/* Shop expandable */}
            <div>
              <button onClick={() => setMobileShopOpen(v => !v)}
                style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#16303A', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #DCE4E6', cursor: 'pointer' }}>
                {tCommon('shop')} <span style={{ fontSize: '0.7rem', color: '#7C93A0' }}>{mobileShopOpen ? '▲' : '▼'}</span>
              </button>
              {mobileShopOpen && (
                <div style={{ paddingTop: '0.75rem', paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1E5F74', marginBottom: 2 }}>{tCommon('shopByCategory')}</div>
                  {SHOP_CATEGORIES.map(({ href, label, icon }) => (
                    <Link key={href} href={href} onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                      style={{ fontFamily: "'Inter', sans-serif", color: '#16303A', textDecoration: 'none', fontSize: '0.88rem', padding: '3px 0' }}>
                      {icon} {label}
                    </Link>
                  ))}
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1E5F74', marginTop: '0.5rem', marginBottom: 2 }}>{tCommon('shopByState')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                    {SHOP_STATES.map(state => (
                      <Link key={state} href={`/shop?state=${encodeURIComponent(state)}`} onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                        style={{ color: '#5B7480', textDecoration: 'none', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" }}>
                        {state}
                      </Link>
                    ))}
                  </div>
                  <Link href="/shop" onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                    style={{ color: '#1E5F74', fontWeight: 700, textDecoration: 'none', fontSize: '0.82rem', marginTop: 4 }}>
                    {tCommon('viewAll')} →
                  </Link>
                </div>
              )}
            </div>

            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#16303A', textDecoration: 'none', fontSize: '0.95rem', letterSpacing: '0.04em', padding: '4px 0', borderBottom: '1px solid #DCE4E6' }}>
                {label}
              </Link>
            ))}
            <Link href="/about#contact" onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#fff', background: '#1E5F74', textDecoration: 'none', fontSize: '0.95rem', padding: '8px 14px', borderRadius: 4, textAlign: 'center' }}>
              {tCommon('contact')}
            </Link>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #DCE4E6' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1E5F74, #1E5F74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                    {(user.user_metadata?.full_name || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#16303A' }}>{user.user_metadata?.full_name || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7C93A0' }}>{user.email}</div>
                  </div>
                </div>
                <Link href="/account/profile" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#16303A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #DCE4E6' }}>
                  👤 {tCommon('myProfile')}
                </Link>
                <Link href="/account/orders" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#16303A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #DCE4E6' }}>
                  📦 {tCommon('myOrders')}
                </Link>
                {isArtisan && (
                  <Link href="/artisan" onClick={() => setMenuOpen(false)}
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#1A7A32', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #DCE4E6' }}>
                    🎨 {tCommon('artisanPanel')}
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#1E5F74', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0', borderBottom: '1px solid #DCE4E6' }}>
                    ⚙️ {tCommon('adminPanel')}
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                  style={{ background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#1E5F74', fontSize: '0.95rem', padding: '4px 0', textAlign: 'left', cursor: 'pointer' }}>
                  🚪 {tCommon('signOut')}
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: '#16303A', textDecoration: 'none', fontSize: '0.95rem', padding: '4px 0' }}>
                {tCommon('signIn')}
              </Link>
            )}
          </div>
        )}
      </nav>

      <style>{`
        .nav-link { font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#5B7480;text-decoration:none;padding:5px 8px;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s;white-space:nowrap; }
        .nav-link:hover { color:#1E5F74;border-bottom-color:#1E5F74; }
        .nav-cta { font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;background:#1E5F74;color:#fff!important;padding:7px 16px;border-radius:4px;text-decoration:none;white-space:nowrap;transition:background 0.2s; }
        .nav-cta:hover { background:#164A5A; }
        @media(max-width:768px) { .nav-desktop{display:none!important;} .nav-mobile-right{display:flex!important;} }
      `}</style>

      {searchOpen && <NavSearch onClose={() => setSearchOpen(false)} />}
    </>
  )
}
