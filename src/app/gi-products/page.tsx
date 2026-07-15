import { createClient } from '@/lib/supabase-server'
import GIProductsClient from './GIProductsClient'
import type { GIProduct } from './GIProductsClient'

export const revalidate = 3600

export default async function GIProductsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gi_products')
    .select('id, name, name_hi, state, gi_tag, year, category, accent, emoji, tagline, tagline_hi, women_role, women_role_hi, history, history_hi, materials, materials_hi, district, women_percent, image_url')
    .order('state', { ascending: true })
    .order('name', { ascending: true })

  return <GIProductsClient products={(data ?? []) as GIProduct[]} />
}
