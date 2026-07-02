import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Link from 'next/link'
import DeleteArtisanButton from './DeleteArtisanButton'
import RegisterArtisanLogin from './RegisterArtisanLogin'
import ArtisanToggle from './ArtisanToggle'

export default async function AdminArtisansPage() {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
  if (profile?.role !== 'admin') return <div>Unauthorized</div>

  // Fetch artisans
  const { data: artisans } = await supabaseAdmin
    .from('artisans')
    .select('*')
    .order('created_at', { ascending: false })

  // Get email confirmation status from auth
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const emailStatusMap = new Map(authUsers.map(u => [u.id, !!u.email_confirmed_at]))

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

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#6B4820' }}>
        <span><span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✓ Email</span> — Artisan confirmed their email</span>
        <span><span style={{ background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>⭐ GI Verified</span> — Shows GI badge on profile</span>
        <span><span style={{ background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>🏠 Featured</span> — Shows on homepage</span>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'hidden' }}>
        {artisans && artisans.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead style={{ background: '#FFE8A8' }}>
              <tr>
                {['Photo', 'Name', 'State', 'Craft', 'Email', 'GI Verified', 'Featured', 'Portal', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(artisans as any[]).map((artisan) => {
                const emailConfirmed = artisan.user_id ? emailStatusMap.get(artisan.user_id) ?? false : null
                return (
                  <tr key={artisan.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFE8A8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {artisan.photo_url
                          ? <img src={artisan.photo_url} alt={artisan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '1.2rem' }}>👩‍🎨</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#1B2E4A' }}>{artisan.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#E8380A', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
                        ART-{String(artisan.serial_no ?? 0).padStart(3, '0')}
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', color: '#6B4820' }}>{artisan.state}</td>
                    <td style={{ padding: '12px 12px', color: '#6B4820' }}>{artisan.craft}</td>

                    {/* Email verification status */}
                    <td style={{ padding: '12px 12px' }}>
                      {emailConfirmed === null ? (
                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>No login</span>
                      ) : emailConfirmed ? (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: '#DCFCE7', color: '#166534' }}>✓ Confirmed</span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }}>⏳ Pending</span>
                      )}
                    </td>

                    {/* GI Verified toggle */}
                    <td style={{ padding: '12px 12px' }}>
                      <ArtisanToggle
                        artisanId={artisan.id}
                        field="is_verified"
                        value={artisan.is_verified}
                        labelOn="⭐ GI Verified"
                        labelOff="Not Verified"
                        colorOn="#854D0E"
                        bgOn="#FEF9C3"
                      />
                    </td>

                    {/* Featured toggle */}
                    <td style={{ padding: '12px 12px' }}>
                      <ArtisanToggle
                        artisanId={artisan.id}
                        field="is_featured"
                        value={artisan.is_featured ?? false}
                        labelOn="🏠 Featured"
                        labelOff="Not Featured"
                        colorOn="#3730A3"
                        bgOn="#E0E7FF"
                      />
                    </td>

                    {/* Portal */}
                    <td style={{ padding: '12px 12px' }}>
                      {artisan.user_id
                        ? <span style={{ fontSize: '0.75rem', color: '#1A7A32', fontWeight: 700 }}>✓ Has login</span>
                        : <RegisterArtisanLogin artisanId={artisan.id} artisanName={artisan.name} />
                      }
                    </td>

                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/admin/artisans/${artisan.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4, textDecoration: 'none' }}>Edit</Link>
                        <DeleteArtisanButton id={artisan.id} name={artisan.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
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
