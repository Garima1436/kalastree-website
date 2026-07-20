import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSecret } from '@/lib/secrets'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const webhookSecret = await getSecret('RAZORPAY_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET missing from both process.env and SSM')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const isValid = Razorpay.validateWebhookSignature(body, signature, webhookSecret)
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity
    const razorpayOrderId = payment?.order_id
    if (!razorpayOrderId) return NextResponse.json({ received: true })

    // Idempotent — skip if the client-side /verify call already processed this payment
    const { data: paymentRow } = await supabaseAdmin
      .from('payments').select('order_id, status').eq('razorpay_order_id', razorpayOrderId).single()

    if (!paymentRow || paymentRow.status === 'captured') return NextResponse.json({ received: true })

    await supabaseAdmin.from('payments').update({
      razorpay_payment_id: payment.id, status: 'captured',
    }).eq('razorpay_order_id', razorpayOrderId)

    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', paymentRow.order_id)

    const { data: items } = await supabaseAdmin
      .from('order_items').select('product_id, quantity').eq('order_id', paymentRow.order_id)

    if (items) {
      await Promise.all(items.map((item: any) =>
        supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity })
      ))
    }
  }

  if (event.event === 'payment.failed') {
    const razorpayOrderId = event.payload?.payment?.entity?.order_id
    if (razorpayOrderId) {
      await supabaseAdmin.from('payments').update({ status: 'failed' })
        .eq('razorpay_order_id', razorpayOrderId).neq('status', 'captured')
    }
  }

  return NextResponse.json({ received: true })
}
