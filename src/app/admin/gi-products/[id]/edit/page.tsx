import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import GIProductForm from '../../GIProductForm'

export default async function EditGIProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: giProduct } = await supabase.from('gi_products').select('*').eq('id', id).single()
  if (!giProduct) notFound()
  return <GIProductForm initialData={giProduct} mode="edit" />
}
