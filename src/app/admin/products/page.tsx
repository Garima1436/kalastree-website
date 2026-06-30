import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteProductButton from './DeleteProductButton'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, artisan:artisans(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          Products
        </h1>
        <Link href="/admin/products/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add Product
        </Link>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 700 }}>
          <thead style={{ background: '#FFE8A8' }}>
            <tr>
              {['Product', 'Artisan', 'Category', 'Price', 'Stock', 'Featured', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: any) => (
              <tr key={p.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1B2E4A', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#E8380A', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
                    PROD-{String(p.serial_no ?? 0).padStart(3, '0')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#D4A000', marginTop: 1 }}>{p.gi_tag ?? '—'}</div>
                </td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>
                  <div>{(p.artisan as any)?.name ?? '—'}</div>
                  {p.artisan_id && <div style={{ fontSize: '0.68rem', color: '#A07840', fontFamily: 'monospace', marginTop: 2 }}>{p.artisan_id}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#FFE8A8', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B4820' }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8380A' }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: p.stock === 0 ? '#EF4444' : '#1A7A32' }}>{p.stock}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>{p.is_featured ? '⭐' : '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin/products/${p.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, textDecoration: 'none', border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4 }}>
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B4820' }}>
            No products yet.{' '}
            <Link href="/admin/products/new" style={{ color: '#E8380A', fontWeight: 700 }}>Add your first product →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
