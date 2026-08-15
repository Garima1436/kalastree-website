import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cancelOrderWithSideEffects } from '@/lib/orders/cancellation'

const ALLOWED_STATUSES = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { orderId, status } = await req.json()
  if (!orderId || !status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (status === 'cancelled') {
    const result = await cancelOrderWithSideEffects({ orderId })
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Could not cancel this order' }, { status: result.status })
    }
    return NextResponse.json({ success: true, refunded: result.refunded ?? false })
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}