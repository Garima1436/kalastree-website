import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, error: null }
}

// Add a media item
export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { product_id, url, type, source, sort_order } = await req.json()
  if (!product_id || !url || !type) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const { data, error: dbError } = await supabase
    .from('product_media')
    .insert({ product_id, url, type, source: source ?? 'upload', sort_order: sort_order ?? 0 })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

// Delete a media item
export async function DELETE(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id, storage_path } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Delete from storage if upload (best effort)
  if (storage_path) {
    await supabase.storage.from('products').remove([storage_path])
  }

  const { error: dbError } = await supabase.from('product_media').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Update sort order
export async function PATCH(req: NextRequest) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id, sort_order } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error: dbError } = await supabase
    .from('product_media')
    .update({ sort_order })
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
