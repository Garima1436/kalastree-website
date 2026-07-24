import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { getSecret } from '@/lib/secrets'

const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000
const CANCELLABLE_STATUSES = ['paid', 'confirmed', 'processing']

async function sendCancellationEmailToCustomer(email: string, name: string, orderShortId: string, isRefunded: boolean) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'KalaStree <team@kalastree.com>',
    to: email,
    subject: `Order #${orderShortId} cancelled — KalaStree`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:26px;color:#E8380A;margin:0;">Kala<em style="color:#D4A000;">Stree</em></h1>
        </div>
        <h2 style="color:#1B2E4A;font-size:20px;margin-bottom:8px;">Your order has been cancelled</h2>
        <p style="color:#6B4820;line-height:1.8;">
          Hi ${name}, order <strong>#${orderShortId}</strong> has been cancelled as you requested.
        </p>
        <p style="color:#6B4820;line-height:1.8;">
          ${isRefunded
            ? 'Your payment has been refunded and should reflect in your account within 5–7 business days, depending on your bank.'
            : 'Since this was a Cash on Delivery order, no payment was collected — there is nothing to refund.'}
        </p>
        <p style="color:#A07840;font-size:12px;text-align:center;margin-top:24px;">Questions? Write to <a href="mailto:garima@kalastree.com" style="color:#E8380A;">garima@kalastree.com</a></p>
      </div>
    `,
  })
}

async function sendCancellationEmailToArtisan(email: string, orderShortId: string, productNames: string[]) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'KalaStree <team@kalastree.com>',
    to: email,
    subject: `Order #${orderShortId} was cancelled by the customer — KalaStree`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:26px;color:#E8380A;margin:0;">Kala<em style="color:#D4A000;">Stree</em></h1>
        </div>
        <h2 style="color:#1B2E4A;font-size:20px;margin-bottom:8px;">Order #${orderShortId} was cancelled</h2>
        <p style="color:#6B4820;line-height:1.8;">
          The customer cancelled this order before it shipped, within KalaStree's 48-hour cancellation window.
          No further action is needed — please don't prepare or ship the following item(s):
        </p>
        <ul style="color:#1B2E4A;line-height:1.8;">
          ${productNames.map(n => `<li>${n}</li>`).join('')}
        </ul>
        <p style="color:#A07840;font-size:12px;text-align:center;margin-top:24px;">Questions? Write to <a href="mailto:garima@kalastree.com" style="color:#E8380A;">garima@kalastree.com</a></p>
      </div>
    `,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_id, created_at, payment_method, total, user_name, user_email')
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: 'This order can no longer be cancelled — it has already shipped.' }, { status: 400 })
  }

  const placedAt = new Date(order.created_at).getTime()
  if (Date.now() - placedAt > CANCEL_WINDOW_MS) {
    return NextResponse.json({ error: 'The 48-hour cancellation window for this order has passed.' }, { status: 400 })
  }

  // Atomic, status-guarded update — only actually cancels if the order is
  // still in a cancellable state at the moment this runs, so a race with the
  // artisan shipping it in the same instant can't leave things inconsistent.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .in('status', CANCELLABLE_STATUSES)
    .select('id')

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'This order can no longer be cancelled — it has already shipped.' }, { status: 409 })
  }

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, product_name, quantity')
    .eq('order_id', orderId)

  // Restock every item — never happened anywhere in the codebase before this.
  if (items?.length) {
    await Promise.all(items.map((item: any) =>
      supabaseAdmin.rpc('increment_stock', { p_product_id: item.product_id, p_qty: item.quantity })
    ))
  }

  // Refund the captured payment for prepaid orders. COD orders never collected
  // money (payment happens at delivery), so there's nothing to refund there.
  let refunded = false
  if (order.payment_method !== 'cod') {
    const { data: payment } = await supabaseAdmin
      .from('payments').select('*').eq('order_id', orderId).single()

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
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
          await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })
        }
        await supabaseAdmin.from('payments').update({
          status: 'refunded',
          refunded_amount: payment.amount,
          refunded_at: new Date().toISOString(),
        }).eq('order_id', orderId)
        refunded = true
      } catch (err: any) {
        // The order is already cancelled for the customer — that part succeeded.
        // The refund itself failed and needs a human to process it manually;
        // payment.status is deliberately left as 'captured' (not 'refunded') so
        // a cancelled order with a still-captured payment is visible as needing
        // follow-up, rather than silently losing the failure.
        console.error(`Refund failed for order ${orderId}:`, err)
      }
    }
  }

  const shortId = orderId.slice(0, 8).toUpperCase()

  // Confirm the cancellation to the customer (best-effort — a failed send
  // shouldn't undo a cancellation that already succeeded).
  try {
    if (order.user_email) {
      await sendCancellationEmailToCustomer(order.user_email, order.user_name ?? '', shortId, refunded)
    }
  } catch (e) {
    console.error('Customer cancellation email failed:', e)
  }

  // Notify whichever artisan(s) had products in this order (best-effort).
  try {
    const productIds = [...new Set((items ?? []).map((i: any) => i.product_id))]
    const { data: products } = await supabaseAdmin
      .from('products').select('id, submitted_by').in('id', productIds)

    const byArtisan = new Map<string, string[]>()
    for (const item of items ?? []) {
      const product = products?.find((p: any) => p.id === item.product_id)
      if (!product?.submitted_by) continue
      const names = byArtisan.get(product.submitted_by) ?? []
      names.push(item.product_name)
      byArtisan.set(product.submitted_by, names)
    }

    await Promise.all(
      [...byArtisan.entries()].map(async ([artisanUserId, names]) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(artisanUserId)
        if (data?.user?.email) await sendCancellationEmailToArtisan(data.user.email, shortId, names)
      })
    )
  } catch (e) {
    console.error('Cancellation notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}
