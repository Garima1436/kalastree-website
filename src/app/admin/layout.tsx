import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getServerLang } from '@/lib/i18n/server'
import { Lang } from '@/lib/i18n/constants'
import dict from '@/lib/i18n/dictionaries/adminHome'

function getT(lang: Lang) {
  return (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') redirect('/?error=unauthorized')

  const lang = await getServerLang()
  const t = getT(lang)

  const LINKS = [
    { href: '/admin', label: `📊 ${t('navDashboard')}` },
    { href: '/admin/products', label: `🏺 ${t('navProducts')}` },
    { href: '/admin/artisans', label: `👩‍🎨 ${t('navArtisans')}` },
    { href: '/admin/gi-products', label: `🗺️ ${t('navGiProducts')}` },
    { href: '/admin/orders', label: `📦 ${t('navOrders')}` },
    { href: '/admin/remittance', label: `💰 ${t('navRemittance')}` },
    { href: '/admin/users', label: `👥 ${t('navUsers')}` },
  ]

  return (
    <div className="panel-shell" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 90px)' }}>
      <aside style={{ background: '#1B2E4A', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(212,160,0,0.2)' }}>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#D4A000' }}>
            {t('adminPanelTitle')}
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
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(212,160,0,0.15)' }}>
          <Link href="/" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            ← {t('backToSite')}
          </Link>
        </div>
      </aside>
      <main style={{ background: '#FFE8A8', padding: '2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .panel-shell { grid-template-columns: 1fr !important; }
          .panel-shell > main { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  )
}
