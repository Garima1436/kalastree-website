import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { JobOpening } from './careers'

// Server-side reads for the public Careers pages. Only rows an admin has left
// visible are ever returned, so a hidden role can't be reached even by guessing
// its address. If the table can't be read (e.g. the migration hasn't been applied
// yet) these degrade to "nothing found" instead of erroring the page.

export const getLiveOpenings = cache(async (): Promise<JobOpening[]> => {
  const { data, error } = await supabaseAdmin
    .from('job_openings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Could not load job openings:', error.message)
    return []
  }
  return (data ?? []) as JobOpening[]
})

// React's cache() means the page and its generateMetadata share one query per request.
export const getLiveOpening = cache(async (id: string): Promise<JobOpening | null> => {
  const { data, error } = await supabaseAdmin
    .from('job_openings')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()
  if (error) {
    console.error('Could not load job opening:', error.message)
    return null
  }
  return (data as JobOpening | null) ?? null
})
