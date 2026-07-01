import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const LINKS = [
  { href: '/artisan', label: '📊 Dashboard' },
  { href: '/artisan/products', label: '🏺 My Products' },
  { href: '/artisan/products/new', label: '+ Add Product' },
]

export default async function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/artisan')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || (profile.role !== 'artisan' && profile.role !== 'admin')) redirect('/?error=unauthorized')

  const { data: artisan } = await supabase.from('artisans').select('name, craft').eq('user_id', user.id).single()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 90px)' }}>
      <aside style={{ background: '#1A7A32', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Artisan Portal
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {artisan?.name ?? profile.full_name ?? user.email}
          </div>
          {artisan?.craft && (
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{artisan.craft}</div>
          )}
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              display: 'block', padding: '10px 1.5rem',
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
              fontSize: '0.88rem', fontWeight: 600,
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profile.role === 'admin' && (
            <Link href="/admin" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              ⚙️ Admin Panel
            </Link>
          )}
          <Link href="/" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            ← Back to site
          </Link>
        </div>
      </aside>
      <main style={{ background: '#F0FFF4', padding: '2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
