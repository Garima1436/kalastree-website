import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { buildOpeningFields, isUuid } from '@/lib/careersValidation'

// Same admin check every other /api/admin route uses. Writes then go through
// supabaseAdmin (service role) — job_openings has row-level security enabled
// with no write policy, so this route is the ONLY way rows get created,
// changed or deleted, and only for a verified admin.
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { error: null }
}

async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await readJson(req)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const built = buildOpeningFields(body, true)
  if ('message' in built) return NextResponse.json({ error: built.message }, { status: 400 })

  const { error: dbError } = await supabaseAdmin.from('job_openings').insert(built.fields)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await readJson(req)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { id } = body
  if (!isUuid(id)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })
  const built = buildOpeningFields(body, false)
  if ('message' in built) return NextResponse.json({ error: built.message }, { status: 400 })
  if (Object.keys(built.fields).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { error: dbError } = await supabaseAdmin.from('job_openings').update(built.fields).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await readJson(req)
  const id = body?.id
  if (!isUuid(id)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })

  const { error: dbError } = await supabaseAdmin.from('job_openings').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
