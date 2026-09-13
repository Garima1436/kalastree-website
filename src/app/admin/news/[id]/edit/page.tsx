import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import NewsForm from '../../NewsForm'

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: item } = await supabase.from('news_events').select('*').eq('id', id).single()
  if (!item) notFound()
  return <NewsForm initialData={item} mode="edit" />
}
