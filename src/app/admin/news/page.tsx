import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteNewsButton from './DeleteNewsButton'

export default async function AdminNewsPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('news_events')
    .select('*')
    .order('published_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
            News & Events
          </h1>
          <div style={{ fontSize: '0.78rem', color: '#6B4820', marginTop: 4 }}>
            {items ? items.length : 0} entr{items?.length === 1 ? 'y' : 'ies'}
          </div>
        </div>
        <Link href="/admin/news/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add Entry
        </Link>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 700 }}>
          <thead style={{ background: '#FFE8A8' }}>
            <tr>
              {['Image', 'Title', 'Author', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((n: any) => (
              <tr key={n.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: '#FFE8A8', border: '1.5px solid #DDB840', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {n.image_url
                      ? <img src={n.image_url} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '1.4rem' }}>📰</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1B2E4A', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                </td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>
                  {n.author || '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>
                  {n.published_at}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin/news/${n.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, textDecoration: 'none', border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4 }}>
                      Edit
                    </Link>
                    <DeleteNewsButton id={n.id} title={n.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!items || items.length === 0) && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B4820' }}>
            No entries yet.{' '}
            <Link href="/admin/news/new" style={{ color: '#E8380A', fontWeight: 700 }}>Add the first one</Link>
          </div>
        )}
      </div>
    </div>
  )
}
