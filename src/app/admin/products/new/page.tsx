import { createClient } from '@/lib/supabase-server'
import ProductForm from './ProductForm'

export default async function AddProductPage() {
  const supabase = await createClient()
  const [{ data: artisans }, { data: giProducts }] = await Promise.all([
    supabase.from('artisans').select('id, name, serial_no').order('name'),
    supabase.from('gi_products').select('id, name, state, gi_tag').order('name'),
  ])
  return <ProductForm artisans={artisans ?? []} giProducts={giProducts ?? []} mode="new" />
}
