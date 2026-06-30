import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSecret } from '@/lib/secrets'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json()

    const keySecret = await getSecret('RAZORPAY_KEY_SECRET')
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' })
    }

    await supabaseAdmin.from('payments').update({
      razorpay_payment_id, razorpay_signature, status: 'captured',
    }).eq('razorpay_order_id', razorpay_order_id)

    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId)

    const { data: items } = await supabaseAdmin
      .from('order_items').select('product_id, quantity').eq('order_id', orderId)

    if (items) {
      await Promise.all(items.map((item: any) =>
        supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity })
      ))
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('verify-payment error:', err)
    return NextResponse.json({ success: false, error: err.message })
  }
}
