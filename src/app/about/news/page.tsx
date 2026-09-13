import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { getVideoEmbedUrl, isDirectVideoUrl } from '@/lib/videoEmbed'
import { stripHtml } from '@/lib/richText'

export const revalidate = 600

export default async function NewsEventsPage() {
  const { data: items } = await supabaseAdmin
    .from('news_events')
    .select('*')
    .order('published_at', { ascending: false })

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>Home</Link> / <Link href="/about" style={{ color: '#D4A000', textDecoration: 'none' }}>About</Link> / News & Events
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            News & Events
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 600 }}>
            Announcements, press mentions, and milestones from KalaStree.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 5%' }}>
        {(!items || items.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B4820' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem' }}>Nothing here yet — check back soon.</p>
          </div>
        ) : (
          <div className="news-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {items.map((n: any) => {
              const embedUrl = n.video_url ? getVideoEmbedUrl(n.video_url) : null
              const directVideo = n.video_url && !embedUrl && isDirectVideoUrl(n.video_url)
              const hasVideo = !!n.video_url
              const hasBody = !!n.body
              const excerpt = hasBody ? stripHtml(n.body) : ''
              // external_link (a real press mention/event page elsewhere) wins
              // when set; otherwise, if there's body content, the card opens
              // the internal detail page — previously an entry with no
              // external_link was a dead end even when it had a full body.
              const primaryHref = n.external_link || (hasBody ? `/about/news/${n.id}` : null)
              const primaryIsExternal = !!n.external_link
              // A <video>/<iframe> can't live inside an <a> (invalid, breaks
              // its own interactivity) — so a video entry never wraps the
              // whole card in the primary-link anchor; instead the link
              // (if any) becomes a small "Read more" line in the text.
              const wholeCardClickable = !!primaryHref && !hasVideo

              const media = embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={n.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : directVideo ? (
                <video controls src={n.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
              ) : n.image_url ? (
                <img src={n.image_url} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '3rem' }}>📰</span>
              )

              const card = (
                <div style={{
                  background: '#FFFFFF', border: '1.5px solid #DDB840', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', height: '100%',
                  transition: 'transform 0.25s, box-shadow 0.25s', cursor: wholeCardClickable ? 'pointer' : 'default',
                }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', background: '#FFE8A8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {media}
                  </div>
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: 8, lineHeight: 1.3 }}>
                      {n.title}
                    </h2>
                    {excerpt && (
                      <p style={{ fontSize: '0.85rem', color: '#6B4820', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {excerpt}
                      </p>
                    )}
                    {hasVideo && !embedUrl && !directVideo && (
                      <a href={n.video_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E8380A', textDecoration: 'none', marginBottom: 12 }}>
                        ▶ Watch Video
                      </a>
                    )}
                    <div style={{ flexGrow: 1 }} />
                    {hasVideo && primaryHref && (
                      <Link href={primaryHref} target={primaryIsExternal ? '_blank' : undefined} rel={primaryIsExternal ? 'noopener noreferrer' : undefined}
                        style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E8380A', textDecoration: 'none', marginBottom: 8 }}>
                        Read more →
                      </Link>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#D4A000', fontWeight: 600 }}>
                      {n.author ? `by ${n.author}` : ''}{n.author && n.published_at ? ' · ' : ''}{n.published_at}
                    </div>
                  </div>
                </div>
              )
              return wholeCardClickable ? (
                <Link key={n.id} href={primaryHref!} target={primaryIsExternal ? '_blank' : undefined} rel={primaryIsExternal ? 'noopener noreferrer' : undefined}
                  style={{ textDecoration: 'none', display: 'block' }}>
                  {card}
                </Link>
              ) : (
                <div key={n.id}>{card}</div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width: 600px) {
          .news-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
