import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { Resend } from 'resend'

async function sendDeliveredEmail(order: any, shortId: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !order.user_email) return
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'KalaStree <team@kalastree.com>',
    to: order.user_email,
    subject: `Delivered! Order #${shortId} has arrived — KalaStree`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:26px;color:#E8380A;margin:0;">Kala<em style="color:#D4A000;">Stree</em></h1>
          <p style="color:#6B4820;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0;">Heritage by Her</p>
        </div>
        <h2 style="color:#1B2E4A;font-size:20px;margin-bottom:8px;">Your order has arrived! 🎉</h2>
        <p style="color:#6B4820;line-height:1.8;margin-bottom:8px;">
          Hi ${order.user_name ?? ''}, our courier partner confirms order <strong>#${shortId}</strong> has been delivered.
        </p>
        <p style="color:#6B4820;line-height:1.8;">
          Thank you for supporting India's women artisans — we hope you love what you received.
        </p>
        <p style="color:#A07840;font-size:12px;text-align:center;margin-top:24px;">Questions? Write to <a href="mailto:garima@kalastree.com" style="color:#E8380A;">garima@kalastree.com</a></p>
        <hr style="border:none;border-top:1px solid #DDB840;margin:20px 0;"/>
        <p style="color:#A07840;font-size:11px;text-align:center;">KalaStree · India's first GI-verified marketplace for women artisans</p>
      </div>
    `,
  })
}

// iThink Logistics webhook — fires on every shipment status change
// Register this URL in iThink dashboard: https://kalastree.com/api/webhooks/ithink
// with header  x-webhook-secret: <ITHINK_WEBHOOK_SECRET>  (mirrors Shiprocket's
// x-api-key / Delhivery's client-defined auth header — iThink doesn't publish its
// own scheme, so this follows the same-category convention). If iThink's dashboard
// can't send custom headers, fall back to appending ?secret=<ITHINK_WEBHOOK_SECRET>
// to the registered URL instead — the query param is checked too.
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ITHINK_WEBHOOK_SECRET
  if (!expected) return false

  const provided = req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!provided) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    // Log every hit (not just failures) so a real payload can be inspected in
    // CloudWatch — iThink's public docs never confirmed the exact field names.
    console.log('iThink webhook payload:', JSON.stringify(body))

    // iThink sends AWB number and status in the payload
    // Exact field names — confirm in iThink dashboard → Webhooks → Sample Payload
    const awb = body.awb_number ?? body.awb ?? body.tracking_number
    const rawStatus: string = (body.current_status ?? body.status ?? '').toLowerCase()

    if (!awb || !rawStatus) {
      console.warn('iThink webhook: could not find awb/status fields in payload above')
      return NextResponse.json({ error: 'Missing awb or status' }, { status: 400 })
    }

    // Map iThink status strings to KalaStree order statuses
    let orderStatus: string | null = null
    if (['delivered', 'rto delivered'].includes(rawStatus)) orderStatus = 'delivered'
    else if (['in transit', 'out for delivery', 'picked up'].includes(rawStatus)) orderStatus = 'shipped'

    if (!orderStatus) {
      // Status we don't act on (e.g. "manifested", "exception") — acknowledge and ignore
      return NextResponse.json({ received: true })
    }

    // Find order by tracking number
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_name, user_email')
      .eq('tracking_number', awb)
      .single()

    if (!order) {
      console.warn(`iThink webhook: no order found for AWB ${awb}`)
      return NextResponse.json({ received: true })
    }

    // Only move forward, never backward
    const statusRank: Record<string, number> = {
      pending: 0, paid: 1, processing: 2, shipped: 3, delivered: 4, cancelled: 5,
    }
    if ((statusRank[orderStatus] ?? 0) <= (statusRank[order.status] ?? 0)) {
      return NextResponse.json({ received: true })
    }

    await supabaseAdmin.from('orders').update({ status: orderStatus }).eq('id', order.id)

    // Notify the customer their order has actually arrived (courier-confirmed —
    // this webhook is now the sole source of truth for delivery status).
    if (orderStatus === 'delivered') {
      try {
        await sendDeliveredEmail(order, order.id.slice(0, 8).toUpperCase())
      } catch (e) {
        console.error('Delivered email failed:', e)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('iThink webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
