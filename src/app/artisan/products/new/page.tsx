import { createClient } from '@/lib/supabase-server'
import ArtisanProductForm from './ArtisanProductForm'

export default async function ArtisanNewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: artisan } = await supabase.from('artisans').select('id').eq('user_id', user!.id).single()
  return <ArtisanProductForm artisanId={artisan?.id ?? null} />
}
