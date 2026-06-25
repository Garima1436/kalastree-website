import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase, user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, user, error: null }
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const payload = await req.json()
  const { error: dbError } = await supabase.from('products').insert(payload)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id, ...payload } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  const { error: dbError } = await supabase.from('products').update(payload).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  const { error: dbError } = await supabase.from('products').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
