import { supabase } from '@/lib/supabase'
import type { Product, Artisan } from '@/lib/types'
import ProductCarousel from '@/components/ProductCarousel'
import ArtisanCard from '@/components/ArtisanCard'
import CategoryGrid from '@/components/CategoryGrid'
import HeroCarousel from '@/components/HeroCarousel'
import Link from 'next/link'
import ComingSoonRibbon from '@/components/ComingSoonRibbon'
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
    supabase.from('products').select('*, artisan:artisans(*)').eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('artisans').select('*').eq('is_verified', true).limit(6),
  ])
  return { products: (products ?? []) as Product[], artisans: (artisans ?? []) as Artisan[] }
}

export default async function HomePage() {
  const { products, artisans } = await getData()
  const heroImages = getHeroImages()

  return (
    <>
      {/* HERO — sunset rose & marigold */}
      <section style={{ background: 'linear-gradient(160deg, #6B1018 0%, #8C1A22 55%, #A02030 100%)', position: 'relative', overflow: 'hidden' }}>

        {/* Decorative circles — top right, like the mockup */}
        <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: '55%', paddingBottom: '55%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '0%', right: '4%', width: '38%', paddingBottom: '38%', borderRadius: '50%', border: '1.5px solid rgba(212,160,0,0.25)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '8%', right: '12%', width: '22%', paddingBottom: '22%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }} />

        {/* ── Text block ── */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '3.5rem 5% 2.5rem', textAlign: 'center', position: 'relative', zIndex: 2 }}>

          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 30, padding: '6px 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', marginBottom: '1.25rem', backdropFilter: 'blur(4px)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4A000', animation: 'pulse 2s infinite' }} />
            AS SEEN IN IIT PATNA RESEARCH · 478 GI PRODUCTS
          </div>

          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2.6rem, 6.5vw, 4.4rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.08, marginBottom: '0.35rem' }}>
            Kala<span style={{ color: '#D4A000', fontStyle: 'italic' }}>Stree</span>
          </h1>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.05rem, 2.5vw, 1.5rem)', fontStyle: 'italic', color: '#D4A000', marginBottom: '1.1rem' }}>
            "Heritage by Her"
          </p>
          <p className="hero-desc" style={{ fontSize: 'clamp(0.88rem, 1.8vw, 1.05rem)', lineHeight: 1.85, color: 'rgba(255,255,255,0.82)', maxWidth: 540, margin: '0 auto 1.75rem' }}>
            India's first GI-verified marketplace where every purchase goes{' '}
            <strong style={{ color: '#fff' }}>directly to the woman who made it</strong> — no middlemen, no compromise.
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.25rem' }}>
            <Link href="/shop" style={{ background: '#D4A000', color: '#1A0800', padding: '13px 30px', borderRadius: 5, fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(212,160,0,0.35)' }}>
              Shop the Collection →
            </Link>
            <Link href="/artisans" style={{ background: 'transparent', color: '#fff', padding: '13px 30px', borderRadius: 5, border: '2px solid rgba(255,255,255,0.55)', fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Meet the Artisans
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats" style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', paddingTop: '1.75rem', borderTop: '1px solid rgba(255,255,255,0.18)', flexWrap: 'wrap' }}>
            {[['478', 'GI Tags'], ['2,500', 'Women Artisans'], ['16', 'States']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 700, color: '#D4A000', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Carousel – full bleed below text ── */}
        <div style={{ position: 'relative', zIndex: 2, paddingBottom: '2.5rem' }}>
          <HeroCarousel images={heroImages} />
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
          @media(max-width:480px){
            .hero-badge { font-size:0.6rem !important; padding:5px 12px !important; }
            .hero-desc  { margin-bottom:1.25rem !important; }
            .hero-btns a { padding:11px 18px !important; font-size:0.82rem !important; width:100%; justify-content:center; }
            .hero-btns  { flex-direction:column !important; align-items:stretch !important; gap:0.6rem !important; }
            .hero-stats { gap:1.5rem !important; padding-top:1.25rem !important; }
          }
        `}</style>
      </section>

      {/* Marigold promo strip */}
      <div style={{ background: '#D4A000', padding: '11px 5%', textAlign: 'center', overflow: 'hidden' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A0800', margin: 0 }}>
          GI VERIFIED ARTISANS &nbsp;◆&nbsp; DIRECT FROM MAKER TO YOU &nbsp;◆&nbsp; FREE SHIPPING ABOVE ₹1499
        </p>
      </div>

      <ComingSoonRibbon />

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
