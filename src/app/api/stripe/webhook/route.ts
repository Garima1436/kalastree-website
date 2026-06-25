import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    // Idempotent — skip if already processed by success redirect
    const { data: payment } = await supabaseAdmin
      .from('payments').select('status').eq('stripe_session_id', session.id).single()

    if (payment?.status === 'captured') return NextResponse.json({ received: true })

    await supabaseAdmin.from('payments').update({
      stripe_payment_intent_id: session.payment_intent as string,
      status: 'captured',
    }).eq('stripe_session_id', session.id)

    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId)

    const { data: items } = await supabaseAdmin
      .from('order_items').select('product_id, quantity').eq('order_id', orderId)

    if (items) {
      await Promise.all(items.map((item: any) =>
        supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity })
      ))
    }
  }

  return NextResponse.json({ received: true })
}
