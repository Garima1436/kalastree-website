import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { CANCEL_WINDOW_MS, cancelOrderWithSideEffects } from '@/lib/orders/cancellation'

async function sendCancellationEmailToCustomer(
  email: string,
  name: string,
  orderShortId: string,
  isRefunded: boolean,
  refundEligible: boolean
) {
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
          <img src="https://kalastree.com/kalastree-logo.png" alt="KalaStree — Heritage by Her" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
        </div>
        <h2 style="color:#1B2E4A;font-size:20px;margin-bottom:8px;">Your order has been cancelled</h2>
        <p style="color:#6B4820;line-height:1.8;">
          Hi ${name}, order <strong>#${orderShortId}</strong> has been cancelled as you requested.
        </p>
        <p style="color:#6B4820;line-height:1.8;">
          ${isRefunded
            ? 'Your payment has been refunded and should reflect in your account within 5–7 business days, depending on your bank.'
            : refundEligible
              ? 'Your order is cancelled. Your payment refund is being reviewed by our team and will be processed shortly.'
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
          <img src="https://kalastree.com/kalastree-logo.png" alt="KalaStree — Heritage by Her" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
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

  const result = await cancelOrderWithSideEffects({
    orderId,
    requireUserId: user.id,
    enforceWindowMs: CANCEL_WINDOW_MS,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Could not cancel this order' }, { status: result.status })
  }

  const order = result.order!
  const items = result.items ?? []
  const refunded = !!result.refunded
  const refundEligible = !!result.refundEligible

  const shortId = orderId.slice(0, 8).toUpperCase()

  // Confirm the cancellation to the customer (best-effort — a failed send
  // shouldn't undo a cancellation that already succeeded).
  try {
    if (order.user_email) {
      await sendCancellationEmailToCustomer(order.user_email, order.user_name ?? '', shortId, refunded, refundEligible)
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
