import { supabaseAdmin } from '@/lib/supabase-admin'

// Server-only — reads from the site_settings table (see migration
// 20260913150000_add_site_settings.sql). Never import into a client
// component; supabaseAdmin uses the service role key.
export async function getSiteSetting(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('site_settings').select('value').eq('key', key).single()
  return data?.value ?? null
}
