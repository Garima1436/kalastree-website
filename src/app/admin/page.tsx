import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function AdminDashboard() {
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
    { label: 'Products', value: productCount ?? 0, color: '#C94B1A', icon: '🏺', href: '/admin/products' },
    { label: 'Artisans', value: artisanCount ?? 0, color: '#3B5A2F', icon: '👩‍🎨', href: '/admin/artisans' },
    { label: 'GI Products', value: giProductCount ?? 0, color: '#B8860B', icon: '🗺️', href: '/admin/gi-products' },
    { label: 'Orders', value: orderCount ?? 0, color: '#B8860B', icon: '📦', href: '/admin/orders' },
    { label: 'Users', value: userCount ?? 0, color: '#1B2E4A', icon: '👥', href: '/admin/users' },
  ]

  const statusColor: Record<string, { bg: string; color: string }> = {
    pending:    { bg: '#F9F0D0', color: '#B8860B' },
    paid:       { bg: '#E8F0E4', color: '#3B5A2F' },
    processing: { bg: '#E8ECF2', color: '#1B2E4A' },
    shipped:    { bg: '#E8ECF2', color: '#1B2E4A' },
    delivered:  { bg: '#E8F0E4', color: '#3B5A2F' },
    cancelled:  { bg: '#FEE2E2', color: '#B91C1C' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          Dashboard
        </h1>
        <Link href="/admin/products/new" style={{ background: '#C94B1A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {stats.map(({ label, value, color, icon, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 10, padding: '1.5rem', borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C5542', marginTop: 6 }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #F2E8D5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#1B2E4A' }}>
            Recent Orders
          </h2>
          <Link href="/admin/orders" style={{ fontSize: '0.82rem', color: '#C94B1A', fontWeight: 700, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead style={{ background: '#F2E8D5' }}>
              <tr>
                {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5C5542', fontSize: '0.7rem' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => {
                const sc = statusColor[order.status] ?? statusColor.pending
                return (
                  <tr key={order.id} style={{ borderTop: '1px solid #F2E8D5' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#1B2E4A' }}>#{order.id.slice(0,8).toUpperCase()}</td>
                    <td style={{ padding: '12px 16px', color: '#1B2E4A' }}>{order.user_name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#C94B1A' }}>₹{Number(order.total).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5C5542' }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5C5542', fontStyle: 'italic' }}>
            No orders yet.
          </div>
        )}
      </div>
    </div>
  )
}
