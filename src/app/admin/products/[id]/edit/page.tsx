import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProductForm from '../../new/ProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: product }, { data: artisans }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('artisans').select('id, name').order('name'),
  ])
  if (!product) notFound()
  return <ProductForm artisans={artisans ?? []} initialData={product} mode="edit" />
}
