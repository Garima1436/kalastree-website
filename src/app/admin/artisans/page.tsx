import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteArtisanButton from './DeleteArtisanButton'
import RegisterArtisanLogin from './RegisterArtisanLogin'

export default async function AdminArtisansPage() {
  const supabase = await createClient()
  const { data: artisans } = await supabase
    .from('artisans')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', margin: 0 }}>Artisans</h1>
          <p style={{ color: '#6B4820', fontSize: '0.85rem', marginTop: 4 }}>{artisans?.length ?? 0} artisans registered</p>
        </div>
        <Link href="/admin/artisans/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add Artisan
        </Link>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'hidden' }}>
        {artisans && artisans.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead style={{ background: '#FFE8A8' }}>
              <tr>
                {['Photo', 'Name', 'State', 'Craft', 'GI Product', 'Verified', 'Portal', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {artisans.map((artisan: any) => (
                <tr key={artisan.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFE8A8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {artisan.photo_url
                        ? <img src={artisan.photo_url} alt={artisan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.2rem' }}>👩‍🎨</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1B2E4A' }}>{artisan.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#E8380A', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
                      ART-{String(artisan.serial_no ?? 0).padStart(3, '0')}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B4820' }}>{artisan.state}</td>
                  <td style={{ padding: '12px 16px', color: '#6B4820' }}>{artisan.craft}</td>
                  <td style={{ padding: '12px 16px', color: '#6B4820', maxWidth: 160 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {artisan.gi_product ?? '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: artisan.is_verified ? '#C8F5D8' : '#FFE8A8', color: artisan.is_verified ? '#1A7A32' : '#A07840' }}>
                      {artisan.is_verified ? '✓ Verified' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {artisan.user_id
                      ? <span style={{ fontSize: '0.75rem', color: '#1A7A32', fontWeight: 700 }}>✓ Has login</span>
                      : <RegisterArtisanLogin artisanId={artisan.id} artisanName={artisan.name} />
                    }
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/admin/artisans/${artisan.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4, textDecoration: 'none' }}>Edit</Link>
                      <DeleteArtisanButton id={artisan.id} name={artisan.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#6B4820' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👩‍🎨</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', marginBottom: '1.5rem' }}>No artisans yet.</p>
            <Link href="/admin/artisans/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 24px', borderRadius: 6, fontWeight: 700, textDecoration: 'none' }}>Add First Artisan →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
