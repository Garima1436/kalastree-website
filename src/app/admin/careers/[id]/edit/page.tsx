import { supabaseAdmin } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import { assertAdmin } from '../../assertAdmin'
import OpeningForm from '../../OpeningForm'
import type { JobOpening } from '@/lib/careers'

export default async function EditOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  await assertAdmin()
  const { id } = await params
  const { data: item } = await supabaseAdmin.from('job_openings').select('*').eq('id', id).single()
  if (!item) notFound()
  return <OpeningForm initialData={item as JobOpening} mode="edit" />
}
