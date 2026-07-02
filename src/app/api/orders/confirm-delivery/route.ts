import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  // Verify the order belongs to this user and is in 'shipped' state
  const { data: order } = await supabaseAdmin
    .from('orders').select('id, status, user_id').eq('id', orderId).single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status !== 'shipped') {
    return NextResponse.json({ error: 'Order is not in shipped status' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('orders').update({ status: 'delivered' }).eq('id', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
