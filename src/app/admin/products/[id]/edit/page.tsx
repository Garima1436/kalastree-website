import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProductForm from '../../new/ProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: product }, { data: artisans }, { data: giProducts }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('artisans').select('id, name').order('name'),
    supabase.from('gi_products').select('id, name, state, gi_tag').order('name'),
  ])
  if (!product) notFound()
  return <ProductForm artisans={artisans ?? []} giProducts={giProducts ?? []} initialData={product} mode="edit" />
}
