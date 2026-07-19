import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

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

    // iThink sends AWB number and status in the payload
    // Exact field names — confirm in iThink dashboard → Webhooks → Sample Payload
    const awb = body.awb_number ?? body.awb ?? body.tracking_number
    const rawStatus: string = (body.current_status ?? body.status ?? '').toLowerCase()

    if (!awb || !rawStatus) {
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
      .select('id, status')
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

    const updates: any = { status: orderStatus }
    if (orderStatus === 'delivered') updates.delivery_otp = null

    await supabaseAdmin.from('orders').update(updates).eq('id', order.id)

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('iThink webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
