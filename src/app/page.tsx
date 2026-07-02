import { supabase } from '@/lib/supabase'
import type { Product, Artisan } from '@/lib/types'
import ProductCarousel from '@/components/ProductCarousel'
import ArtisanCard from '@/components/ArtisanCard'
import CategoryGrid from '@/components/CategoryGrid'
import HeroCarousel from '@/components/HeroCarousel'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'

export const revalidate = 300

function getHeroImages(): string[] {
  try {
    const dir = path.join(process.cwd(), 'public', 'hero')
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
      .sort()
      .map(f => `/hero/${f}`)
  } catch {
    return []
  }
}

async function getData() {
  const [{ data: products }, { data: artisans }] = await Promise.all([
    supabase.from('products').select('*, artisan:artisans(*)').eq('is_featured', true).eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
    supabase.from('artisans').select('*').eq('is_verified', true).limit(6),
  ])
  return { products: (products ?? []) as Product[], artisans: (artisans ?? []) as Artisan[] }
}

export default async function HomePage() {
  const { products, artisans } = await getData()
  const heroImages = getHeroImages()

  return (
    <>
      {/* HERO */}
      <section style={{ background: '#5C0A14', position: 'relative', overflow: 'hidden' }}>

        {/* Subtle radial glow in centre */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(120,20,30,0.6) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Left folk-art SVG */}
        <svg viewBox="0 0 220 520" style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 'auto', opacity: 0.18, pointerEvents: 'none' }} fill="none" stroke="#D4A000" strokeWidth="1.2">
          {/* spinning wheel */}
          <circle cx="50" cy="400" r="38" /><circle cx="50" cy="400" r="28" />
          {[0,45,90,135,180,225,270,315].map(a => <line key={a} x1="50" y1="400" x2={50+38*Math.cos(a*Math.PI/180)} y2={400+38*Math.sin(a*Math.PI/180)} />)}
          {/* woman silhouette */}
          <ellipse cx="80" cy="180" rx="18" ry="22" /><line x1="80" y1="202" x2="80" y2="270" /><line x1="80" y1="220" x2="55" y2="255" /><line x1="80" y1="220" x2="105" y2="250" /><line x1="80" y1="270" x2="60" y2="320" /><line x1="80" y1="270" x2="100" y2="320" />
          {/* flowers */}
          {[60,90,120].map((y,i) => <g key={y}><circle cx={20+i*15} cy={y} r="6" />{[0,60,120,180,240,300].map(a=><ellipse key={a} cx={20+i*15+10*Math.cos(a*Math.PI/180)} cy={y+10*Math.sin(a*Math.PI/180)} rx="4" ry="2" transform={`rotate(${a},${20+i*15+10*Math.cos(a*Math.PI/180)},${y+10*Math.sin(a*Math.PI/180)})`} />)}</g>)}
          {/* vines */}
          <path d="M 10 500 Q 30 450 20 400 Q 40 350 15 300 Q 35 250 10 200" /><path d="M 10 380 Q 40 360 55 340" /><path d="M 20 300 Q 45 285 60 265" />
          {/* peacock feather */}
          <path d="M 160 20 Q 140 80 150 140 Q 155 200 140 260" /><ellipse cx="140" cy="270" rx="12" ry="18" /><path d="M 150 140 Q 170 120 185 130" /><path d="M 148 160 Q 168 145 180 158" /><path d="M 145 180 Q 162 170 172 183" />
        </svg>

        {/* Right folk-art SVG */}
        <svg viewBox="0 0 220 520" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 'auto', opacity: 0.18, pointerEvents: 'none', transform: 'scaleX(-1)' }} fill="none" stroke="#D4A000" strokeWidth="1.2">
          <ellipse cx="80" cy="180" rx="18" ry="22" /><line x1="80" y1="202" x2="80" y2="270" /><line x1="80" y1="220" x2="55" y2="255" /><line x1="80" y1="220" x2="105" y2="250" /><line x1="80" y1="270" x2="60" y2="320" /><line x1="80" y1="270" x2="100" y2="320" />
          {/* loom */}
          <rect x="30" y="300" width="80" height="60" rx="2" /><line x1="30" y1="315" x2="110" y2="315" /><line x1="30" y1="330" x2="110" y2="330" /><line x1="30" y1="345" x2="110" y2="345" />
          {[45,60,75,90,105].map(x => <line key={x} x1={x} y1="300" x2={x} y2="360" />)}
          {/* flowers */}
          {[50,85,120].map((y,i) => <g key={y}><circle cx={180-i*15} cy={y} r="6" />{[0,60,120,180,240,300].map(a=><ellipse key={a} cx={180-i*15+10*Math.cos(a*Math.PI/180)} cy={y+10*Math.sin(a*Math.PI/180)} rx="4" ry="2" transform={`rotate(${a},${180-i*15+10*Math.cos(a*Math.PI/180)},${y+10*Math.sin(a*Math.PI/180)})`} />)}</g>)}
          <path d="M 210 500 Q 190 450 200 400 Q 180 350 205 300 Q 185 250 210 200" /><path d="M 200 380 Q 170 360 155 340" /><path d="M 195 300 Q 165 285 150 265" />
          <path d="M 160 20 Q 140 80 150 140 Q 155 200 140 260" /><ellipse cx="140" cy="270" rx="12" ry="18" /><path d="M 150 140 Q 170 120 185 130" /><path d="M 148 160 Q 168 145 180 158" />
        </svg>

        {/* Main content */}
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '1rem 5% 0', textAlign: 'center', position: 'relative', zIndex: 2 }}>

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src="/kalastree-logo.png" alt="KalaStree — Heritage by Her"
              style={{ height: 'clamp(200px, 32vw, 360px)', width: 'auto', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 0 40px rgba(212,160,0,0.3))' }} />
          </div>

          <p className="hero-desc" style={{ fontSize: 'clamp(0.92rem, 1.8vw, 1.1rem)', lineHeight: 1.9, color: 'rgba(255,255,255,0.85)', maxWidth: 580, margin: '0 auto 2rem' }}>
            India's first GI-verified marketplace where every purchase goes{' '}
            <strong style={{ color: '#D4A000' }}>directly to the woman who made it</strong> — no middlemen, no compromise.
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link href="/shop" style={{ background: '#D4A000', color: '#1A0800', padding: '14px 34px', borderRadius: 6, fontFamily: "'Lato', sans-serif", fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(212,160,0,0.4)' }}>
              Shop the Collection →
            </Link>
            <Link href="/artisans" style={{ background: 'transparent', color: '#fff', padding: '14px 34px', borderRadius: 6, border: '2px solid rgba(255,255,255,0.5)', fontFamily: "'Lato', sans-serif", fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Meet the Artisans
            </Link>
          </div>
        </div>

        {/* Stats bar — icon left, text right, always one row */}
        <div style={{ borderTop: '1px solid rgba(212,160,0,0.25)', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', width: '100%' }}>
            {[
              { icon: '🏺', num: '478', label: 'GI PRODUCTS', sub: 'Authentic. Verified. Unique.' },
              { icon: '👩‍🎨', num: '2,500+', label: 'WOMEN ARTISANS', sub: 'Empowered. Skilled. Proud.' },
              { icon: '🗺️', num: '16', label: 'STATES', sub: 'Diverse. Rich. United.' },
              { icon: '🌐', num: 'GLOBAL', label: 'MARKETPLACE', sub: 'Bringing India to the World.' },
            ].map(({ icon, num, label, sub }, i) => (
              <div key={label} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', gap: 'clamp(6px,1.2vw,14px)', padding: 'clamp(0.7rem,1.8vw,1.2rem) clamp(0.4rem,1.5vw,1.2rem)', borderLeft: i > 0 ? '1px solid rgba(212,160,0,0.2)' : 'none' }}>
                {/* Icon */}
                <div style={{ fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', lineHeight: 1, flexShrink: 0, filter: 'drop-shadow(0 0 6px rgba(212,160,0,0.4))' }}>{icon}</div>
                {/* Text */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.1rem,2.8vw,1.9rem)', fontWeight: 700, color: '#D4A000', lineHeight: 1, whiteSpace: 'nowrap' }}>{num}</div>
                  <div style={{ fontSize: 'clamp(0.48rem,1.1vw,0.65rem)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginTop: 3 }}>{label}</div>
                  <div style={{ fontSize: 'clamp(0.44rem,1vw,0.6rem)', color: 'rgba(212,160,0,0.65)', marginTop: 2, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sliding hero images — same as before */}
        {heroImages.length > 0 && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <HeroCarousel images={heroImages} />
          </div>
        )}

        <style>{`
          @media(max-width:600px){
            .hero-btns a { padding:12px 20px !important; font-size:0.85rem !important; width:100%; justify-content:center; }
            .hero-btns  { flex-direction:column !important; align-items:stretch !important; }
          }
        `}</style>
      </section>

      {/* Marigold promo strip */}
      <div style={{ background: '#D4A000', padding: '11px 5%', textAlign: 'center', overflow: 'hidden' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A0800', margin: 0 }}>
          GI VERIFIED ARTISANS &nbsp;◆&nbsp; DIRECT FROM MAKER TO YOU &nbsp;◆&nbsp; FREE SHIPPING ABOVE ₹1499
        </p>
      </div>

      {/* <ComingSoonRibbon /> */}

      {/* GI CATEGORIES */}
      <section style={{ padding: '5rem 5%', background: '#FFE8A8' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="folk-divider"><span>✦ ✧ ✦</span></div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', textAlign: 'center', marginBottom: '0.6rem' }}>Browse by Category</p>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A', textAlign: 'center', marginBottom: '3rem' }}>
            Four Pillars of India's <span style={{ color: '#E8380A' }}>GI Heritage</span>
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: '5rem 5%', background: 'var(--parchment)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.4rem' }}>Handpicked for You</p>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A' }}>
                Featured <span style={{ color: '#E8380A' }}>GI Products</span>
              </h2>
            </div>
            <Link href="/shop" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#E8380A', textDecoration: 'none', border: '1.5px solid #E8380A', padding: '8px 20px', borderRadius: 4 }}>
              View All Products →
            </Link>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B4820' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>Products coming soon. <Link href="/join" style={{ color: '#E8380A' }}>Join as an artisan →</Link></p>
            </div>
          ) : (
            <ProductCarousel products={products} />
          )}
        </div>
      </section>

      {/* MISSION STRIP */}
      <section style={{ background: '#1B2E4A', padding: '1rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='10' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3Ccircle cx='10' cy='30' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='30' r='3'/%3E%3Ccircle cx='10' cy='50' r='3'/%3E%3Ccircle cx='30' cy='50' r='3'/%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', position: 'relative', zIndex: 1 }}>
          {[
            { icon: '✅', title: 'GI Verified', body: 'Every product is cross-checked with the DPIIT GI Registry for authenticity.' },
            { icon: '🌾', title: 'Women First', body: '60–80% of GI sector work is done by women. We make sure they get paid for it.' },
            { icon: '🤖', title: 'AI Powered', body: 'Ask our RAG chatbot anything about GI crafts, regions, or product history.' },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{title}</div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARTISANS */}
      {artisans.length > 0 && (
        <section style={{ padding: '5rem 5%', background: '#FFE8A8' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.4rem' }}>The Hands Behind the Craft</p>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A' }}>
                Meet Our <span style={{ color: '#E8380A' }}>Artisans</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/artisans" style={{ background: '#E8380A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                View All Artisans →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA — Join as Artisan */}
      <section style={{ padding: '5rem 5%', background: '#C8F5D8' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧵</div>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1A7A32', marginBottom: '1rem' }}>
            Are You a Woman Artisan?
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#6B4820', marginBottom: '2rem' }}>
            Join KalaStree and sell your GI-tagged craft directly to buyers across India and the world. Get paid directly. No middlemen. Your story, your price, your income.
          </p>
          <Link href="/join" style={{ background: '#1A7A32', color: '#fff', padding: '14px 32px', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '1rem', display: 'inline-block' }}>
            Apply to Sell on KalaStree →
          </Link>
        </div>
      </section>
    </>
  )
}
