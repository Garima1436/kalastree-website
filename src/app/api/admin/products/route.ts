import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase, user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, user, error: null }
}

// The artisan's "My Products" panel filters on submitted_by (the owning
// auth user), while this form only picks artisan_id (the artisans-table
// row). Resolve the linked user here so admin-assigned products still
// show up in that artisan's panel.
async function resolveSubmittedBy(supabase: any, artisanId: string | null | undefined) {
  if (!artisanId) return null
  const { data } = await supabase.from('artisans').select('user_id').eq('id', artisanId).single()
  return data?.user_id ?? null
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const payload = await req.json()
  const submitted_by = await resolveSubmittedBy(supabase, payload.artisan_id)
  const { data, error: dbError } = await supabase.from('products').insert({ ...payload, submitted_by }).select('id').single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id })
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id, ...payload } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  // Clear rejection_note when approving
  if (payload.status === 'approved') payload.rejection_note = null
  if ('artisan_id' in payload) payload.submitted_by = await resolveSubmittedBy(supabase, payload.artisan_id)
  const { error: dbError } = await supabase.from('products').update(payload).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  revalidatePath('/')
  revalidatePath('/shop')
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  const { error: dbError } = await supabase.from('products').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  revalidatePath('/')
  revalidatePath('/shop')
  return NextResponse.json({ success: true })
}
