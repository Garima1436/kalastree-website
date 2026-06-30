import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/products', label: '🏺 Products' },
  { href: '/admin/artisans', label: '👩‍🎨 Artisans' },
  { href: '/admin/gi-products', label: '🗺️ GI Products' },
  { href: '/admin/orders', label: '📦 Orders' },
  { href: '/admin/users', label: '👥 Users' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') redirect('/?error=unauthorized')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 90px)' }}>
      <aside style={{ background: '#1B2E4A', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(184,134,11,0.2)' }}>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#B8860B' }}>
            Admin Panel
          </div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>
            KalaStree
          </div>
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              display: 'block', padding: '10px 1.5rem',
              color: 'rgba(255,255,255,0.72)', textDecoration: 'none',
              fontSize: '0.88rem', fontWeight: 600,
              borderLeft: '3px solid transparent',
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(184,134,11,0.15)' }}>
          <Link href="/" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            ← Back to site
          </Link>
        </div>
      </aside>
      <main style={{ background: '#F2E8D5', padding: '2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
