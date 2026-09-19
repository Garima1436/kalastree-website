import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

// The admin layout already gates /admin, but these pages read hidden roles
// with the server's service key, so each one re-checks on its own rather than
// trusting that the layout ran for this particular request.
export async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/careers')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/?error=unauthorized')
}
