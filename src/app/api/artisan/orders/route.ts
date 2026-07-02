import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

async function sendDeliveryOTPEmail(order: any, otp: string, shortId: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !order.user_email) return
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: 'KalaStree <team@kalastree.com>',
    to: order.user_email,
    subject: `Your Delivery OTP for Order #${shortId} — KalaStree`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:26px;color:#E8380A;margin:0;">Kala<em style="color:#D4A000;">Stree</em></h1>
          <p style="color:#6B4820;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0;">Heritage by Her</p>
        </div>
        <h2 style="color:#1B2E4A;font-size:20px;margin-bottom:8px;">Your order is on the way! 🚚</h2>
        <p style="color:#6B4820;line-height:1.8;margin-bottom:24px;">
          Your order <strong>#${shortId}</strong> has been shipped and is out for delivery.<br/>
          Share the OTP below with the delivery person when they arrive at your door.
        </p>
        <div style="background:#1B2E4A;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
          <p style="color:#D4A000;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Your Delivery OTP</p>
          <div style="font-size:52px;font-weight:900;letter-spacing:16px;color:#fff;font-family:monospace;">${otp}</div>
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:12px 0 0;">Valid for 48 hours · Do not share with anyone except the delivery person</p>
        </div>
        <div style="background:#FFE8A8;border-left:4px solid #E8380A;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
          <p style="margin:0;color:#1B2E4A;font-size:13px;line-height:1.7;">
            <strong>How it works:</strong><br/>
            The delivery person will ask for this 4-digit code at your door. Once you share it, your order will be automatically marked as delivered.
          </p>
        </div>
        <p style="color:#A07840;font-size:12px;text-align:center;">Questions? Write to <a href="mailto:garima@kalastree.com" style="color:#E8380A;">garima@kalastree.com</a></p>
        <hr style="border:none;border-top:1px solid #DDB840;margin:20px 0;"/>
        <p style="color:#A07840;font-size:11px;text-align:center;">KalaStree · India's first GI-verified marketplace for women artisans</p>
      </div>
    `,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'artisan' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { orderId, status } = body
  if (!orderId || !['processing', 'cancelled', 'shipped'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify this order contains at least one of the artisan's products
  const { data: myProducts } = await supabaseAdmin
    .from('products').select('id').eq('submitted_by', user.id)
  const myProductIds = (myProducts ?? []).map((p: any) => p.id)

  if (myProductIds.length === 0) {
    return NextResponse.json({ error: 'No products linked to your account' }, { status: 403 })
  }

  const { data: orderItem } = await supabaseAdmin
    .from('order_items').select('id').eq('order_id', orderId).in('product_id', myProductIds).limit(1).single()

  if (!orderItem) {
    return NextResponse.json({ error: 'Order does not contain your products' }, { status: 403 })
  }

  const updates: any = { status }
  if (body.tracking_number) updates.tracking_number = body.tracking_number
  if (body.tracking_url) updates.tracking_url = body.tracking_url

  // When shipping: generate OTP as fallback and email customer with tracking
  if (status === 'shipped') {
    const otp = generateOTP()
    updates.delivery_otp = otp
    updates.delivery_otp_sent_at = new Date().toISOString()

    const { error: dbError } = await supabaseAdmin.from('orders').update(updates).eq('id', orderId)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Send OTP email (non-blocking)
    try {
      const { data: order } = await supabaseAdmin
        .from('orders').select('user_name, user_email').eq('id', orderId).single()
      if (order) await sendDeliveryOTPEmail(order, otp, orderId.slice(0, 8).toUpperCase())
    } catch (e) {
      console.error('OTP email failed:', e)
    }
  } else {
    const { error: dbError } = await supabaseAdmin.from('orders').update(updates).eq('id', orderId)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
