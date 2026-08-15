import Razorpay from 'razorpay'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSecret } from '@/lib/secrets'

export const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000
export const CANCELLABLE_STATUSES = ['paid', 'confirmed', 'processing']

type CancelOrderOptions = {
  orderId: string
  requireUserId?: string
  enforceWindowMs?: number
}

type CancelOrderResult = {
  ok: boolean
  status: number
  error?: string
  refunded?: boolean
  refundEligible?: boolean
  order?: any
  items?: any[]
}

export async function cancelOrderWithSideEffects(options: CancelOrderOptions): Promise<CancelOrderResult> {
  const { orderId, requireUserId, enforceWindowMs } = options

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_id, created_at, payment_method, total, user_name, user_email')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { ok: false, status: 404, error: 'Order not found' }
  }

  if (requireUserId && order.user_id !== requireUserId) {
    return { ok: false, status: 404, error: 'Order not found' }
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return {
      ok: false,
      status: 400,
      error: 'This order can no longer be cancelled — it has already shipped.',
    }
  }

  if (enforceWindowMs) {
    const placedAt = new Date(order.created_at).getTime()
    if (Date.now() - placedAt > enforceWindowMs) {
      return {
        ok: false,
        status: 400,
        error: 'The 48-hour cancellation window for this order has passed.',
      }
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .in('status', CANCELLABLE_STATUSES)
    .select('id')

  if (updateError) {
    return { ok: false, status: 500, error: updateError.message }
  }

  if (!updated || updated.length === 0) {
    return {
      ok: false,
      status: 409,
      error: 'This order can no longer be cancelled — it has already shipped.',
    }
  }

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, product_name, quantity')
    .eq('order_id', orderId)

  if (itemsError) {
    return { ok: false, status: 500, error: itemsError.message }
  }

  if (items?.length) {
    await Promise.all(
      items.map((item: any) =>
        supabaseAdmin.rpc('increment_stock', { p_product_id: item.product_id, p_qty: item.quantity })
      )
    )
  }

  const refundEligible = order.payment_method !== 'cod'
  let refunded = false

  if (refundEligible) {
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle()

    if (paymentError) {
      console.error(`Payment lookup failed for order ${orderId}:`, paymentError)
    }

    if (payment && payment.status === 'captured') {
      try {
        if (payment.razorpay_payment_id) {
          const [keyId, keySecret] = await Promise.all([
            getSecret('RAZORPAY_KEY_ID'),
            getSecret('RAZORPAY_KEY_SECRET'),
          ])
          if (!keyId || !keySecret) throw new Error('Razorpay secrets not configured')
          const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
          await razorpay.payments.refund(payment.razorpay_payment_id, {
            amount: Math.round(Number(payment.amount) * 100),
          })
        } else if (payment.stripe_payment_intent_id) {
          if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe secret key not configured')
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
          await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })
        }

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'refunded',
            refunded_amount: payment.amount,
            refunded_at: new Date().toISOString(),
          })
          .eq('order_id', orderId)

        refunded = true
      } catch (err: any) {
        console.error(`Refund failed for order ${orderId}:`, err)
      }
    }
  }

  return { ok: true, status: 200, refunded, refundEligible, order, items: items ?? [] }
}