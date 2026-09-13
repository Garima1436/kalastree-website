import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVideoEmbedUrl, isDirectVideoUrl } from '@/lib/videoEmbed'
import { estimateReadTime } from '@/lib/richText'

export const revalidate = 600

export default async function NewsEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: n } = await supabaseAdmin.from('news_events').select('*').eq('id', id).single()
  if (!n) notFound()

  const embedUrl = n.video_url ? getVideoEmbedUrl(n.video_url) : null
  const directVideo = n.video_url && !embedUrl && isDirectVideoUrl(n.video_url)
  const readTime = n.body ? estimateReadTime(n.body) : null

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.06'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>Home</Link> / <Link href="/about/news" style={{ color: '#D4A000', textDecoration: 'none' }}>News & Events</Link>
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: '#fff', marginBottom: 10 }}>
            {n.title}
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            {n.author ? `By ${n.author}` : ''}{n.author && n.published_at ? ' · ' : ''}{n.published_at}
            {readTime ? ` · ${readTime} min read` : ''}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '3rem 5%' }}>
        {embedUrl ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', marginBottom: '2rem', background: '#000' }}>
            <iframe
              src={embedUrl}
              title={n.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : directVideo ? (
          <video controls src={n.video_url} style={{ width: '100%', marginBottom: '2rem', background: '#000' }} />
        ) : n.image_url ? (
          <img src={n.image_url} alt={n.title} style={{ width: '100%', marginBottom: '2rem' }} />
        ) : null}

        {n.video_url && !embedUrl && !directVideo && (
          <a href={n.video_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', fontSize: '0.9rem', fontWeight: 700, color: '#E8380A', textDecoration: 'none', marginBottom: '1.5rem' }}>
            ▶ Watch Video
          </a>
        )}

        {n.body && (
          <div className="rich-text" style={{ fontSize: '1rem', lineHeight: 1.8, color: '#3A2A10' }}
            dangerouslySetInnerHTML={{ __html: n.body }} />
        )}

        {n.external_link && (
          <a href={n.external_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: '2rem', fontSize: '0.9rem', fontWeight: 700, color: '#E8380A', textDecoration: 'none' }}>
            Read the full story →
          </a>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #DDB840' }}>
          <Link href="/about/news" style={{ fontSize: '0.85rem', color: '#6B4820', textDecoration: 'none' }}>
            ← Back to News & Events
          </Link>
        </div>
      </div>

      <style>{`
        .rich-text img { max-width: 100%; height: auto; display: block; border-radius: 6px; margin: 1rem 0; }
        .rich-text p { margin: 0 0 1em; }
        .rich-text h2 { font-family: 'EB Garamond', serif; font-size: 1.5rem; font-weight: 700; margin: 1.5em 0 0.5em; color: #1B2E4A; }
        .rich-text h3 { font-family: 'EB Garamond', serif; font-size: 1.25rem; font-weight: 700; margin: 1.25em 0 0.5em; color: #1B2E4A; }
        .rich-text blockquote { border-left: 3px solid #DDB840; padding-left: 16px; color: #6B4820; font-style: italic; margin: 1em 0; }
        .rich-text ul { padding-left: 1.4em; margin: 0 0 1em; }
      `}</style>
    </div>
  )
}
