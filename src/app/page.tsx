import { supabase } from '@/lib/supabase'
import type { Product, Artisan } from '@/lib/types'
import ProductCarousel from '@/components/ProductCarousel'
import ArtisanCard from '@/components/ArtisanCard'
import CategoryGrid from '@/components/CategoryGrid'
import Link from 'next/link'

export const revalidate = 60

async function getData() {
  const [{ data: products }, { data: artisans }] = await Promise.all([
    supabase.from('products').select('*, artisan:artisans(*)').eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('artisans').select('*').eq('is_verified', true).limit(6),
  ])
  return { products: (products ?? []) as Product[], artisans: (artisans ?? []) as Artisan[] }
}

export default async function HomePage() {
  const { products, artisans } = await getData()

  return (
    <>
      {/* HERO */}
      <section className="hero-section" style={{ minHeight: '88vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 5%', background: 'var(--parchment)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 60% 80% at 20% 60%, rgba(201,75,26,0.06) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 80% 40%, rgba(59,90,47,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8F0E4', border: '1px solid #3B5A2F', borderRadius: 30, padding: '6px 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3B5A2F', marginBottom: '1.5rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B5A2F', animation: 'pulse 2s infinite' }} />
            478 GI Products · 16 States · 2,500 Women
          </div>

          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2.8rem, 5vw, 4.2rem)', fontWeight: 700, color: '#C94B1A', lineHeight: 1.1, marginBottom: '0.4rem' }}>
            KalaStree
          </h1>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', fontStyle: 'italic', color: '#B8860B', marginBottom: '1.5rem' }}>
            "Heritage by Her"
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#5C5542', maxWidth: 500, marginBottom: '2rem' }}>
            India's first GI-verified marketplace where every purchase goes <strong>directly to the woman who made it</strong> — no middlemen, no compromise.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link href="/shop" style={{ background: '#C94B1A', color: '#fff', padding: '14px 30px', borderRadius: 5, fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}>
              Shop GI Products →
            </Link>
            <Link href="/artisans" style={{ background: 'transparent', color: '#C94B1A', padding: '14px 30px', borderRadius: 5, border: '2px solid #C94B1A', fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Meet the Artisans
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats" style={{ display: 'flex', gap: '2.5rem', paddingTop: '2rem', borderTop: '1.5px solid #D9C9A8' }}>
            {[['478', 'GI Tags'], ['2,500', 'Women Empowered'], ['16', 'States']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#C94B1A', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5542', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero right — artisan collage + animated craft cards */}
        <div className="hero-image" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 0' }}>

          {/* Main straight image */}
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 16px 56px rgba(26,10,0,0.22)',
            animation: 'fadeInUp 0.7s ease both',
          }}>
            <img
              src="/artisan_collage.png"
              alt="Women artisans from across India crafting GI-tagged products"
              style={{ width: '100%', maxWidth: 520, display: 'block' }}
            />
          </div>

        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
          @keyframes cardPopIn { from{opacity:0;transform:translateY(16px) scale(0.85)} to{opacity:1;transform:translateY(0) scale(1)} }
          .craft-card { opacity: 0; }
          @media(max-width:768px){
            .hero-section { grid-template-columns:1fr !important; padding: 2rem 5% !important; min-height: auto !important; }
            .hero-image { padding: 0 !important; }
            .hero-image img { max-width: 100% !important; border-radius: 12px !important; }
            .hero-section > div:first-child { padding-top: 2rem !important; padding-bottom: 1rem !important; }
            .hero-stats { flex-direction: row !important; gap: 1.5rem !important; flex-wrap: wrap !important; }
          }
        `}</style>
      </section>

      {/* GI CATEGORIES */}
      <section style={{ padding: '5rem 5%', background: '#F2E8D5' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="folk-divider"><span>✦ ✧ ✦</span></div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3B5A2F', textAlign: 'center', marginBottom: '0.6rem' }}>Browse by Category</p>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A', textAlign: 'center', marginBottom: '3rem' }}>
            Four Pillars of India's <span style={{ color: '#C94B1A' }}>GI Heritage</span>
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: '5rem 5%', background: 'var(--parchment)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3B5A2F', marginBottom: '0.4rem' }}>Handpicked for You</p>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A' }}>
                Featured <span style={{ color: '#C94B1A' }}>GI Products</span>
              </h2>
            </div>
            <Link href="/shop" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#C94B1A', textDecoration: 'none', border: '1.5px solid #C94B1A', padding: '8px 20px', borderRadius: 4 }}>
              View All Products →
            </Link>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#5C5542' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>Products coming soon. <Link href="/join" style={{ color: '#C94B1A' }}>Join as an artisan →</Link></p>
            </div>
          ) : (
            <ProductCarousel products={products} />
          )}
        </div>
      </section>

      {/* MISSION STRIP */}
      <section style={{ background: '#1B2E4A', padding: '2rem 5%', position: 'relative', overflow: 'hidden' }}>
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
        <section style={{ padding: '5rem 5%', background: '#F2E8D5' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3B5A2F', marginBottom: '0.4rem' }}>The Hands Behind the Craft</p>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, color: '#1B2E4A' }}>
                Meet Our <span style={{ color: '#C94B1A' }}>Artisans</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/artisans" style={{ background: '#C94B1A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                View All Artisans →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA — Join as Artisan */}
      <section style={{ padding: '5rem 5%', background: '#E8F0E4' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧵</div>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#3B5A2F', marginBottom: '1rem' }}>
            Are You a Woman Artisan?
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#5C5542', marginBottom: '2rem' }}>
            Join KalaStree and sell your GI-tagged craft directly to buyers across India and the world. Get paid directly. No middlemen. Your story, your price, your income.
          </p>
          <Link href="/join" style={{ background: '#3B5A2F', color: '#fff', padding: '14px 32px', borderRadius: 5, fontWeight: 700, textDecoration: 'none', fontSize: '1rem', display: 'inline-block' }}>
            Apply to Sell on KalaStree →
          </Link>
        </div>
      </section>
    </>
  )
}
