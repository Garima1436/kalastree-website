import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// iThink Logistics webhook — fires on every shipment status change
// Register this URL in iThink dashboard: https://kalastree.com/api/webhooks/ithink
export async function POST(req: NextRequest) {
  try {
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
