import { createClient } from '@/lib/supabase-server'
import RoleToggle from './RoleToggle'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const total = profiles?.length ?? 0
  const admins = profiles?.filter((p: any) => p.role === 'admin').length ?? 0
  const artisans = profiles?.filter((p: any) => p.role === 'artisan').length ?? 0
  const users = total - admins - artisans

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', margin: 0 }}>
            Users
          </h1>
          <p style={{ color: '#6B4820', fontSize: '0.85rem', marginTop: 4 }}>
            {total} total &nbsp;·&nbsp; {admins} admin{admins !== 1 ? 's' : ''} &nbsp;·&nbsp; {artisans} artisan{artisans !== 1 ? 's' : ''} &nbsp;·&nbsp; {users} customer{users !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        {profiles && profiles.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 750 }}>
            <thead style={{ background: '#FFE8A8' }}>
              <tr>
                {['User', 'Email', 'Phone', 'Location', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile: any) => {
                const initials = (profile.full_name || profile.email || 'U')
                  .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                const role = profile.role ?? 'user'
                const isAdmin = role === 'admin'
                const isArtisan = role === 'artisan'
                const avatarBg = isAdmin ? 'linear-gradient(135deg,#D4A000,#E8380A)' : isArtisan ? 'linear-gradient(135deg,#1A7A32,#2ECC71)' : 'linear-gradient(135deg,#1B2E4A,#1A7A32)'
                return (
                  <tr key={profile.id} style={{ borderTop: '1px solid #FFE8A8' }}>

                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1B2E4A' }}>{profile.full_name || '—'}</div>
                          <div style={{ fontSize: '0.68rem', color: '#A07840', fontFamily: 'monospace' }}>{profile.id.slice(0, 12)}…</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '12px 16px', color: '#6B4820', fontSize: '0.83rem' }}>{profile.email || '—'}</td>

                    {/* Phone */}
                    <td style={{ padding: '12px 16px', color: '#6B4820', fontSize: '0.83rem' }}>{profile.phone || '—'}</td>

                    {/* Location */}
                    <td style={{ padding: '12px 16px', color: '#6B4820', fontSize: '0.83rem' }}>
                      {[profile.city, profile.state].filter(Boolean).join(', ') || '—'}
                    </td>

                    {/* Role badge */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                        background: isAdmin ? '#FFF0C0' : isArtisan ? '#C8F5D8' : '#FFE8A8',
                        color: isAdmin ? '#D4A000' : isArtisan ? '#1A7A32' : '#6B4820',
                        border: isAdmin ? '1px solid #D4A00040' : isArtisan ? '1px solid #1A7A3240' : '1px solid #DDB840',
                      }}>
                        {isAdmin ? '⚙️ Admin' : isArtisan ? '🎨 Artisan' : '👤 User'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 16px', color: '#A07840', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <RoleToggle userId={profile.id} currentRole={profile.role ?? 'user'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#6B4820' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>No users yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
