import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

async function requireArtisan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'artisan' && profile?.role !== 'admin') {
    return { user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireArtisan()
  if (error || !user) return error!

  const payload = await req.json()
  const { data, error: dbError } = await supabaseAdmin
    .from('products')
    .insert({ ...payload, submitted_by: user.id, status: 'pending', is_featured: false })
    .select('id')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireArtisan()
  if (error || !user) return error!

  const { id, ...payload } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Verify ownership
  const { data: existing } = await supabaseAdmin.from('products').select('submitted_by').eq('id', id).single()
  if (!existing || existing.submitted_by !== user.id) {
    return NextResponse.json({ error: 'Not your product' }, { status: 403 })
  }

  // Re-submit as pending when edited
  const { error: dbError } = await supabaseAdmin
    .from('products')
    .update({ ...payload, status: 'pending', is_featured: false })
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
