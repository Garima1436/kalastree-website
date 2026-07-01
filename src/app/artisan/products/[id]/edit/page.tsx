import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ArtisanProductForm from '../../new/ArtisanProductForm'

export default async function ArtisanEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: product }, { data: artisan }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('submitted_by', user!.id).single(),
    supabase.from('artisans').select('id').eq('user_id', user!.id).single(),
  ])

  if (!product) notFound()

  return <ArtisanProductForm artisanId={artisan?.id ?? null} initialData={product} mode="edit" />
}
