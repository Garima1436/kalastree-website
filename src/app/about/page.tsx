import Link from 'next/link'
import QuoteSlider from '@/components/QuoteSlider'
import { getServerLang, getT } from '@/lib/i18n/server'

export default async function AboutPage() {
  const lang = await getServerLang()
  const t = getT('about', lang)
  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: '#1B2E4A', padding: '4rem 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            {t('heroTitlePart1')} <span style={{ color: '#E8380A' }}>{t('heroTitleHidden')}</span><br />{t('heroTitlePart2')} <span style={{ color: '#D4A000' }}>{t('heroTitleInvisible')}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', lineHeight: 1.85 }}>
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      {/* Mission */}
      <section id="gi-products" style={{ padding: '5rem 5%' }}>
        <div className="about-mission-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.6rem' }}>{t('missionEyebrow')}</p>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1.5rem' }}>
              {t('missionTitlePart1')} <span style={{ color: '#E8380A' }}>{t('missionTitlePart2')}</span>
            </h2>
            {[
              { n: '01', title: t('pillar1Title'), body: t('pillar1Body') },
              { n: '02', title: t('pillar2Title'), body: t('pillar2Body') },
              { n: '03', title: t('pillar3Title'), body: t('pillar3Body') },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: '#E8380A', flexShrink: 0, lineHeight: 1 }}>{n}</div>
                <div>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 4 }}>{title}</div>
                  <p style={{ fontSize: '0.9rem', color: '#6B4820', lineHeight: 1.75 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Right column — quote slider */}
          <QuoteSlider />
        </div>
      </section>

      {/* About Garima */}
      <section id="research" style={{ padding: '5rem 5%', background: '#FFE8A8' }}>
        <div className="about-research-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '4rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: '12px 50% 12px 50%', border: '2.5px solid #D4A000', overflow: 'hidden', background: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <img src="/garima.jpeg" alt="Garima Awasthi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.6rem' }}>{t('founderEyebrow')}</p>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1rem' }}>
              {t('founderNameIntro')} <span style={{ color: '#E8380A' }}>Garima Awasthi</span>
            </h2>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontStyle: 'italic', color: '#1B2E4A', lineHeight: 1.7, marginBottom: '1rem' }}>
              {t('founderQuote')}
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#6B4820', marginBottom: '1rem' }}>
              {t('founderBioPart1')} <strong>{t('founderBioInstitution')}</strong> {t('founderBioPart2')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '1.5rem' }}>
              {[t('tagPhdScholar'), t('tagIitPatna'), t('tagFintechResearch'), t('tagWomenEmpowerment'), t('tagGiProducts'), t('tagSpringerAuthor')].map(tag => (
                <span key={tag} style={{ background: '#FFF8EE', border: '1px solid #DDB840', padding: '5px 14px', borderRadius: 30, fontSize: '0.75rem', fontWeight: 700, color: '#6B4820', letterSpacing: '0.05em' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="our-story" style={{ padding: '5rem 5%', background: 'var(--parchment)' }}>
        <div className="about-research-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '4rem', alignItems: 'start' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: '12px 50% 12px 50%', border: '2.5px solid #D4A000', overflow: 'hidden', background: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem' }}>🖼️</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.6rem' }}>{t('storyEyebrow')}</p>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1.5rem' }}>
              {t('storyTitlePart1')} <span style={{ color: '#E8380A' }}>Jitwarpur</span>
            </h2>

            {[
              t('storyPara1'),
              t('storyPara2'),
              t('storyPara3'),
              t('storyPara4'),
            ].map((para, i) => (
              <p key={i} style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#6B4820', marginBottom: '1rem' }}>
                {para.split('\n').map((line, j) => (
                  <span key={j}>{j > 0 && <br />}{line}</span>
                ))}
              </p>
            ))}

            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#1B2E4A', marginTop: '1.75rem', marginBottom: '1rem' }}>
              {t('storyNameLine')}
            </p>

            {[
              t('storyPara5'),
              t('storyPara6'),
            ].map((para, i) => (
              <p key={i} style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#6B4820', marginBottom: '1rem' }}>
                {para.split('\n').map((line, j) => (
                  <span key={j}>{j > 0 && <br />}{line}</span>
                ))}
              </p>
            ))}

            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#1B2E4A', marginTop: '1.75rem', marginBottom: '1rem' }}>
              {t('storyBoldLine').split('\n').map((line, j) => (
                <span key={j}>{j > 0 && <br />}{line}</span>
              ))}
            </p>

            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#6B4820', marginBottom: '1rem' }}>
              {t('storyPara7').split('\n').map((line, j) => (
                <span key={j}>{j > 0 && <br />}{line}</span>
              ))}
            </p>

            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#6B4820', marginTop: '1.75rem', marginBottom: '1.75rem' }}>
              {t('storyPara8').split('\n').map((line, j) => (
                <span key={j}>{j > 0 && <br />}{line}</span>
              ))}
            </p>

            <div style={{ borderTop: '1px solid #DDB840', paddingTop: '1.25rem' }}>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1B2E4A', marginBottom: 2 }}>{t('storyFooterName')}</p>
              <p style={{ fontSize: '0.85rem', color: '#6B4820', marginBottom: 2 }}>{t('storyFooterRole')}</p>
              <p style={{ fontSize: '0.85rem', color: '#6B4820' }}>{t('storyFooterCred')}</p>
            </div>

            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontStyle: 'italic', color: '#1B2E4A', lineHeight: 1.7, marginTop: '1.75rem' }}>
              {t('storyClosingQuote').split('\n').map((line, j) => (
                <span key={j}>{j > 0 && <br />}{line}</span>
              ))}
            </p>
          </div>
        </div>
      </section>

      {/* Publications */}
      <section id="publications" style={{ padding: '5rem 5%', background: 'var(--parchment)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1A7A32', marginBottom: '0.6rem' }}>{t('publicationsEyebrow')}</p>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '2.5rem' }}>
            {t('publicationsTitlePart1')} <span style={{ color: '#E8380A' }}>{t('publicationsTitlePart2')}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { venue: 'Springer LNNS · ISMS 2025', title: 'Building a Domain-Specific AI Research Assistant Using Llama 3.1 & Retrieval-Augmented Generation (RAG)', meta: 'Garima Awasthi, Dr. Rajiv Misra, Dr. Nutan Kumar Tomar · IIT Patna · 2025 · A local RAG pipeline making PhD research on GI products and women empowerment queryable with zero cloud dependency.' },
              { venue: 'Primary Research · 2024–25', title: 'Empowering Women with FinTech Access in GI-Tagged Product Ecosystems — A Survey of 2,500 Women across 16 Indian States', meta: 'Garima Awasthi · IIT Patna · Ongoing PhD Research · Examining UPI, AEPS, microloan, marketplace and insurtech adoption among women artisans in GI value chains.' },
              { venue: 'Conference Presentation', title: 'Multimodal Research Framework: Integrating Survey Data, GI Registry, and AI for Women\'s Empowerment Analysis', meta: 'Garima Awasthi · IIT Patna · 2025 · Presented at ISMS 2025 — combining CSV data, Excel multimodal reports, and RAG AI for comprehensive GI research.' },
            ].map(({ venue, title, meta }) => (
              <div key={title} style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderLeft: '4px solid #E8380A', borderRadius: '0 10px 10px 0', padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'inline-block', background: '#1B2E4A', color: '#D4A000', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 3, marginBottom: 8 }}>{venue}</div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#1B2E4A', marginBottom: 6, lineHeight: 1.4 }}>{title}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B4820', lineHeight: 1.6 }}>{meta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memorial */}
      <section id="tribute" style={{ background: '#1B2E4A', padding: '4rem 5%', borderTop: '1px solid rgba(212,160,0,0.2)', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'diya 3s ease-in-out infinite', display: 'inline-block' }}>🪔</div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: '1rem' }}>{t('memorialEyebrow')}</p>
          <h3 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{t('memorialTitlePart1')} <span style={{ color: '#D4A000' }}>S.B. Sharma</span></h3>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', lineHeight: 1.85, maxWidth: 580, margin: '1.5rem auto' }}>
            {t('memorialQuote')}
          </p>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
            {t('memorialAttribution')}
          </p>
        </div>
        <style>{`@keyframes diya { 0%,100%{transform:scale(1) rotate(-2deg)} 50%{transform:scale(1.08) rotate(2deg)} }`}</style>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '5rem 5%' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#1B2E4A', marginBottom: '1rem' }}>
            {t('contactTitle')}
          </h2>
          <p style={{ color: '#6B4820', lineHeight: 1.8, marginBottom: '2rem' }}>
            {t('contactBody')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <a href="mailto:garima@kalastree.com" style={{ color: '#E8380A', fontWeight: 700, textDecoration: 'none', fontSize: '1.05rem' }}>✉️ garima@kalastree.com</a>
            <span style={{ color: '#6B4820' }}>🏛️ {t('contactInstitution')}</span>
            <a href="https://www.linkedin.com/in/iammishu" target="_blank" rel="noopener" style={{ color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>💼 linkedin.com/in/iammishu</a>
          </div>
          <div className="about-cta-buttons" style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/join" style={{ background: '#E8380A', color: '#fff', padding: '14px 32px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>{t('joinAsArtisanCta')}</Link>
            <Link href="/shop" style={{ background: 'transparent', color: '#E8380A', padding: '14px 32px', borderRadius: 5, border: '2px solid #E8380A', fontWeight: 700, textDecoration: 'none' }}>{t('browseProductsCta')}</Link>
          </div>
        </div>
      </section>
      <style>{`
        @media(max-width:768px){
          .about-mission-grid { grid-template-columns:1fr !important; gap:2rem !important; }
          .about-research-grid { grid-template-columns:1fr !important; gap:2rem !important; }
          .about-research-grid > div:first-child { max-width:260px; margin:0 auto; }
        }
      `}</style>
    </div>
  )
}
