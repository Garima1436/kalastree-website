import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { isUuid } from '@/lib/careersValidation'
import { requireAdmin } from '../../requireAdmin'

// Admin-only: redirects to a short-lived signed link for the applicant's resume.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { data: row } = await supabaseAdmin.from('job_applications').select('resume_path, resume_name').eq('id', id).maybeSingle()
  if (!row?.resume_path) return NextResponse.json({ error: 'No resume on file' }, { status: 404 })
  const { data, error: signError } = await supabaseAdmin.storage
    .from('resumes')
    .createSignedUrl(row.resume_path, 60, { download: row.resume_name ?? true })
  if (signError || !data) return NextResponse.json({ error: 'Could not open resume' }, { status: 500 })
  return NextResponse.redirect(data.signedUrl)
}
