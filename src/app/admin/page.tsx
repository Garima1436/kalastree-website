import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { getServerLang } from '@/lib/i18n/server'
import { Lang } from '@/lib/i18n/constants'
import dict from '@/lib/i18n/dictionaries/adminHome'
import commonDict from '@/lib/i18n/dictionaries/common'

function getT(lang: Lang) {
  return (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
}
function getCommonT(lang: Lang) {
  return (key: keyof typeof commonDict.en): string => commonDict[lang]?.[key] ?? commonDict.en[key]
}

export default async function AdminDashboard() {
  const lang = await getServerLang()
  const t = getT(lang)
  const tc = getCommonT(lang)
  const supabase = await createClient()
  const [
    { count: productCount },
    { count: artisanCount },
    { count: orderCount },
    { count: userCount },
    { count: giProductCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('artisans').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('gi_products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: t('navProducts'), value: productCount ?? 0, color: '#E8380A', icon: '🏺', href: '/admin/products' },
    { label: t('navArtisans'), value: artisanCount ?? 0, color: '#1A7A32', icon: '👩‍🎨', href: '/admin/artisans' },
    { label: t('navGiProducts'), value: giProductCount ?? 0, color: '#D4A000', icon: '🗺️', href: '/admin/gi-products' },
    { label: t('navOrders'), value: orderCount ?? 0, color: '#D4A000', icon: '📦', href: '/admin/orders' },
    { label: t('navUsers'), value: userCount ?? 0, color: '#1B2E4A', icon: '👥', href: '/admin/users' },
  ]

  const statusColor: Record<string, { bg: string; color: string }> = {
    pending:    { bg: '#FFF3A8', color: '#D4A000' },
    paid:       { bg: '#C8F5D8', color: '#1A7A32' },
    processing: { bg: '#E0EAFF', color: '#1B2E4A' },
    shipped:    { bg: '#E0EAFF', color: '#1B2E4A' },
    delivered:  { bg: '#C8F5D8', color: '#1A7A32' },
    cancelled:  { bg: '#FEE2E2', color: '#B91C1C' },
  }

  const statusLabel: Record<string, string> = {
    pending: t('statusPending'),
    paid: t('statusPaid'),
    processing: t('statusProcessing'),
    shipped: t('statusShipped'),
    delivered: t('statusDelivered'),
    cancelled: t('statusCancelled'),
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {t('navDashboard')}
        </h1>
        <Link href="/admin/products/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          {t('addProductBtn')}
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {stats.map(({ label, value, color, icon, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, padding: '1.5rem', borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginTop: 6 }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #FFE8A8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#1B2E4A' }}>
            {t('recentOrders')}
          </h2>
          <Link href="/admin/orders" style={{ fontSize: '0.82rem', color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
            {t('viewAllArrow')}
          </Link>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 600 }}>
            <thead style={{ background: '#FFE8A8' }}>
              <tr>
                {[t('thOrderId'), t('thCustomer'), t('thAmount'), tc('status'), t('thDate')].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => {
                const sc = statusColor[order.status] ?? statusColor.pending
                return (
                  <tr key={order.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#1B2E4A' }}>#{order.order_number ?? order.id.slice(0,8).toUpperCase()}</td>
                    <td style={{ padding: '12px 16px', color: '#1B2E4A' }}>{order.user_name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8380A' }}>₹{Number(order.total).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {(statusLabel[order.status] ?? order.status).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B4820' }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B4820', fontStyle: 'italic' }}>
            {t('noOrdersYet')}
          </div>
        )}
      </div>
    </div>
  )
}
