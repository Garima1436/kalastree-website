import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { artisanId, email, password, fullName } = await req.json()
  if (!artisanId || !email || !password) {
    return NextResponse.json({ error: 'artisanId, email and password are required' }, { status: 400 })
  }

  // Check artisan isn't already linked
  const { data: artisan } = await supabaseAdmin.from('artisans').select('user_id, name').eq('id', artisanId).single()
  if (!artisan) return NextResponse.json({ error: 'Artisan not found' }, { status: 404 })
  if (artisan.user_id) return NextResponse.json({ error: 'This artisan already has a login account' }, { status: 409 })

  // Create auth user via admin SDK (doesn't affect current session)
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || artisan.name },
  })
  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  const newUserId = newUser.user.id

  // Set role to artisan in profiles
  await supabaseAdmin.from('profiles').upsert({
    id: newUserId,
    email,
    full_name: fullName || artisan.name,
    role: 'artisan',
  })

  // Link artisan record to user
  const { error: linkError } = await supabaseAdmin
    .from('artisans').update({ user_id: newUserId }).eq('id', artisanId)

  if (linkError) {
    // Rollback: delete the created user
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  revalidatePath('/artisans')
  revalidatePath('/')

  return NextResponse.json({ success: true, userId: newUserId })
}
