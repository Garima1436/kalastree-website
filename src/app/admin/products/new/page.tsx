import { createClient } from '@/lib/supabase-server'
import ProductForm from './ProductForm'

export default async function AddProductPage() {
  const supabase = await createClient()
  const { data: artisans } = await supabase.from('artisans').select('id, name, serial_no').order('name')
  return <ProductForm artisans={artisans ?? []} mode="new" />
}
