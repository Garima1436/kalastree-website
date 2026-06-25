import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  const origin = req.nextUrl.origin

  if (!sessionId) return NextResponse.redirect(new URL('/checkout', origin))

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/checkout?error=payment_failed', origin))
    }

    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.redirect(new URL('/', origin))

    // Check if already processed (idempotent)
    const { data: payment } = await supabaseAdmin
      .from('payments').select('status').eq('stripe_session_id', sessionId).single()

    if (payment?.status !== 'captured') {
      await supabaseAdmin.from('payments').update({
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'captured',
      }).eq('stripe_session_id', sessionId)

      await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId)

      const { data: items } = await supabaseAdmin
        .from('order_items').select('product_id, quantity').eq('order_id', orderId)

      if (items) {
        await Promise.all(items.map((item: any) =>
          supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity })
        ))
      }
    }

    return NextResponse.redirect(new URL(`/order/${orderId}`, origin))
  } catch (err: any) {
    console.error('stripe success error:', err)
    return NextResponse.redirect(new URL('/checkout?error=verification_failed', origin))
  }
}
