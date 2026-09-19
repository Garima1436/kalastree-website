import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { APPLICATION_STATUSES } from '@/lib/careers'
import { isUuid } from '@/lib/careersValidation'
import { requireAdmin } from './requireAdmin'

async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

// Change an application's status.
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  const body = await readJson(req)
  const id = body?.id
  const status = body?.status
  if (typeof id !== 'string' || !isUuid(id) || typeof status !== 'string' || !(APPLICATION_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { error: dbError } = await supabaseAdmin.from('job_applications').update({ status }).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Delete an application and its stored resume.
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  const body = await readJson(req)
  const id = body?.id
  if (typeof id !== 'string' || !isUuid(id)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { data: row } = await supabaseAdmin.from('job_applications').select('resume_path').eq('id', id).maybeSingle()
  if (row?.resume_path) {
    const { error: storageError } = await supabaseAdmin.storage.from('resumes').remove([row.resume_path])
    if (storageError) console.error('Could not remove resume file:', storageError.message)
  }
  const { error: dbError } = await supabaseAdmin.from('job_applications').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
