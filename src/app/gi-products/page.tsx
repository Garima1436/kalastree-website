import { createClient } from '@/lib/supabase-server'
import GIProductsClient from './GIProductsClient'
import type { GIProduct } from './GIProductsClient'

export const revalidate = 60

export default async function GIProductsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gi_products')
    .select('id, name, state, gi_tag, year, category, accent, emoji, tagline, women_role, history, materials, district, women_percent, image_url')
    .order('state', { ascending: true })
    .order('name', { ascending: true })

  return <GIProductsClient products={(data ?? []) as GIProduct[]} />
}
