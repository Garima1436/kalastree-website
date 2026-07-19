import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const MAX_OTP_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  const { shortId, otp } = await req.json()
  if (!shortId || !otp) return NextResponse.json({ error: 'Order ID and OTP are required' }, { status: 400 })
  if (!/^[0-9a-f]{8}$/i.test(shortId)) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Find order by short ID prefix (first 8 chars of UUID)
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, status, delivery_otp, delivery_otp_sent_at, delivery_otp_attempts')
    .ilike('id', `${shortId.toLowerCase()}%`)
    .limit(1)

  const order = orders?.[0]
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'delivered') return NextResponse.json({ error: 'Order already marked delivered' }, { status: 400 })
  if (order.status !== 'shipped') return NextResponse.json({ error: 'Order is not in shipped status' }, { status: 400 })
  if (!order.delivery_otp) return NextResponse.json({ error: 'No OTP generated for this order' }, { status: 400 })

  // OTP expires after 48 hours
  const sentAt = new Date(order.delivery_otp_sent_at)
  const hoursElapsed = (Date.now() - sentAt.getTime()) / 1000 / 3600
  if (hoursElapsed > 48) return NextResponse.json({ error: 'OTP has expired. Customer must request a new one.' }, { status: 400 })

  const attempts = order.delivery_otp_attempts ?? 0
  if (attempts >= MAX_OTP_ATTEMPTS) {
    // Lock this OTP out entirely — artisan/admin must trigger a reship to issue a new one
    await supabaseAdmin.from('orders').update({ delivery_otp: null }).eq('id', order.id)
    return NextResponse.json({ error: 'Too many incorrect attempts. This OTP has been invalidated — customer must request a new one.' }, { status: 429 })
  }

  if (order.delivery_otp !== otp.trim()) {
    await supabaseAdmin.from('orders').update({ delivery_otp_attempts: attempts + 1 }).eq('id', order.id)
    const remaining = MAX_OTP_ATTEMPTS - attempts - 1
    return NextResponse.json({ error: `Incorrect OTP. Please ask the customer for the correct code. (${remaining} attempt${remaining === 1 ? '' : 's'} left)` }, { status: 400 })
  }

  // Mark delivered and clear OTP
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'delivered', delivery_otp: null, delivery_otp_attempts: 0 })
    .eq('id', order.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
