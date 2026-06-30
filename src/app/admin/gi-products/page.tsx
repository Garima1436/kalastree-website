import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteGIProductButton from './DeleteGIProductButton'

export default async function AdminGIProductsPage() {
  const supabase = await createClient()
  const { data: giProducts } = await supabase
    .from('gi_products')
    .select('*')
    .order('state', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
            GI Products
          </h1>
          <div style={{ fontSize: '0.78rem', color: '#5C5542', marginTop: 4 }}>
            {giProducts ? giProducts.length : 0} Geographical Indication product{giProducts?.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Link href="/admin/gi-products/new" style={{ background: '#C94B1A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add GI Product
        </Link>
      </div>

      <div style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 800 }}>
          <thead style={{ background: '#F2E8D5' }}>
            <tr>
              {['Photo', 'Name', 'State', 'Category', 'Women%', 'GI Tag', 'Year', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5C5542', fontSize: '0.7rem' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(giProducts ?? []).map((p: any) => (
              <tr key={p.id} style={{ borderTop: '1px solid #F2E8D5' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: '#F2E8D5', border: '1.5px solid #D9C9A8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '1.4rem' }}>{p.emoji ?? '🗺️'}</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1B2E4A', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.tagline && (
                    <div style={{ fontSize: '0.72rem', color: '#9A8E7A', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tagline}</div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: '#5C5542' }}>
                  <div>{p.state ?? '—'}</div>
                  {p.district && <div style={{ fontSize: '0.72rem', color: '#9A8E7A', marginTop: 2 }}>{p.district}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#F2E8D5', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#5C5542' }}>
                    {p.category ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#3B5A2F' }}>
                  {p.women_percent != null ? `${p.women_percent}%` : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#B8860B', fontWeight: 600 }}>
                  {p.gi_tag ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#5C5542' }}>
                  {p.year ?? '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin/gi-products/${p.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, textDecoration: 'none', border: '1px solid #D9C9A8', padding: '4px 10px', borderRadius: 4 }}>
                      Edit
                    </Link>
                    <DeleteGIProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!giProducts || giProducts.length === 0) && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5C5542' }}>
            No GI products yet.{' '}
            <Link href="/admin/gi-products/new" style={{ color: '#C94B1A', fontWeight: 700 }}>Add your first GI product →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
