import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ role: null })

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return Response.json({ role: data?.role ?? 'user', userId: user.id })
  } catch {
    return Response.json({ role: null })
  }
}
