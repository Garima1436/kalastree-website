import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'artisan' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { orderId, status } = await req.json()
  if (!orderId || !['processing', 'cancelled', 'shipped'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify this order contains at least one of the artisan's products
  const { data: myProducts } = await supabaseAdmin
    .from('products').select('id').eq('submitted_by', user.id)
  const myProductIds = (myProducts ?? []).map((p: any) => p.id)

  if (myProductIds.length === 0) {
    return NextResponse.json({ error: 'No products linked to your account' }, { status: 403 })
  }

  const { data: orderItem } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)
    .in('product_id', myProductIds)
    .limit(1)
    .single()

  if (!orderItem) {
    return NextResponse.json({ error: 'Order does not contain your products' }, { status: 403 })
  }

  const { error: dbError } = await supabaseAdmin.from('orders').update({ status }).eq('id', orderId)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
