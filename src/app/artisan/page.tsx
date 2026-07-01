import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function ArtisanDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: artisan } = await supabase.from('artisans').select('id, name').eq('user_id', user!.id).single()

  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: rejected },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('submitted_by', user!.id),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('submitted_by', user!.id).eq('status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('submitted_by', user!.id).eq('status', 'approved'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('submitted_by', user!.id).eq('status', 'rejected'),
  ])

  const stats = [
    { label: 'Total Products', value: total ?? 0, color: '#1B2E4A', href: '/artisan/products' },
    { label: 'Pending Approval', value: pending ?? 0, color: '#D4A000', href: '/artisan/products' },
    { label: 'Live / Approved', value: approved ?? 0, color: '#1A7A32', href: '/artisan/products' },
    { label: 'Rejected', value: rejected ?? 0, color: '#E8380A', href: '/artisan/products' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', margin: 0 }}>
            Welcome{artisan?.name ? `, ${artisan.name.split(' ')[0]}` : ''}!
          </h1>
          <p style={{ color: '#1A7A32', fontSize: '0.85rem', marginTop: 4 }}>Artisan Portal — KalaStree</p>
        </div>
        <Link href="/artisan/products/new" style={{ background: '#1A7A32', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add Product
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {stats.map(({ label, value, color, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B4820', marginTop: 6 }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {!artisan && (
        <div style={{ background: '#FFF3CD', border: '1px solid #D4A000', borderRadius: 8, padding: '1rem 1.25rem', color: '#7A5800', fontSize: '0.88rem' }}>
          ⚠️ Your account is not yet linked to an artisan profile. Please ask the admin to link your account to an artisan record.
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '1.5rem' }}>
        <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#1B2E4A', marginBottom: '0.75rem' }}>
          How it works
        </h2>
        <ol style={{ color: '#1A7A32', lineHeight: 2, paddingLeft: '1.25rem', margin: 0, fontSize: '0.9rem' }}>
          <li>Add your product with photos, description, price and stock</li>
          <li>Your product goes to the admin for review (<strong>Pending</strong>)</li>
          <li>Once approved it goes <strong>Live</strong> on the KalaStree shop</li>
          <li>You receive payment directly when a customer buys</li>
        </ol>
      </div>
    </div>
  )
}
