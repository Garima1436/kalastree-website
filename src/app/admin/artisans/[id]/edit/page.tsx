import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ArtisanForm from '../../new/ArtisanForm'

export default async function EditArtisanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: artisan } = await supabase.from('artisans').select('*').eq('id', id).single()
  if (!artisan) notFound()
  return <ArtisanForm mode="edit" initialData={artisan} />
}
