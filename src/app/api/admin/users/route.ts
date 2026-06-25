import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// PATCH — toggle a user's role
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, role } = await req.json()
  if (!userId || !['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  // Use supabaseAdmin to bypass RLS — admin-only action already verified above
  const { error: updateError } = await supabaseAdmin.from('profiles').update({ role }).eq('id', userId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Sync user_metadata so navbar admin button updates on next login
  await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { role } })

  return NextResponse.json({ success: true })
}
