import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Artisan } from '@/lib/types'
import ArtisanCard from '@/components/ArtisanCard'
import Link from 'next/link'

export const revalidate = 600

export default async function ArtisansPage() {
  // Fetch all artisans
  const { data: allArtisans } = await supabaseAdmin
    .from('artisans')
    .select('*')
    .order('created_at', { ascending: false })

  // Get email-confirmed user IDs from auth
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const confirmedUserIds = new Set(users.filter(u => u.email_confirmed_at).map(u => u.id))

  // Show artisans who:
  // - have no portal login (admin-added manually) OR
  // - have a portal login AND confirmed their email
  const artisans = ((allArtisans ?? []) as Artisan[]).filter(a =>
    !a.user_id || confirmedUserIds.has(a.user_id)
  )

  return (
    <div style={{ background: 'var(--parchment)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#1A7A32', padding: '3.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23B8860B' opacity='0.08'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='50' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>Home</Link> / Artisans
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            The Hands Behind India's Heritage
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 600 }}>
            Women artisans from 16 states — each carrying centuries of knowledge, skill, and culture in their hands.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 5%' }}>
        {/* Stats bar */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, padding: '1.5rem 2rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '3rem', justifyContent: 'center' }}>
          {[['60–80%', 'of GI sector workforce is women'], ['0.393', 'Avg Empowerment Index'], ['2,500', 'Women surveyed in our research'], ['0%', 'of platforms were built for them — until now']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: '#E8380A' }}>{n}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B4820', maxWidth: 160, lineHeight: 1.4 }}>{l}</div>
            </div>
          ))}
        </div>

        {artisans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B4820' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👩‍🎨</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', marginBottom: '1rem' }}>Artisans joining soon.</p>
            <Link href="/join" style={{ background: '#1A7A32', color: '#fff', padding: '12px 24px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
              Are you an artisan? Apply here →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}
