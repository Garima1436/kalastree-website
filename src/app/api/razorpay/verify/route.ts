import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'
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
      .from('order_items').select('product_id, product_name, quantity, price').eq('order_id', orderId)

    if (items) {
      await Promise.all(items.map((item: any) =>
        supabaseAdmin.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity })
      ))
    }

    // Send order confirmation email
    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('user_name, user_email, total, address_line, city, state, pincode')
        .eq('id', orderId)
        .single()

      const apiKey = process.env.RESEND_API_KEY
      if (order?.user_email && apiKey && items) {
        const resend = new Resend(apiKey)
        const shortId = orderId.slice(0, 8).toUpperCase()
        const itemRows = items.map((item: any) => `
          <tr>
            <td style="padding:10px 12px;color:#1B2E4A;border-bottom:1px solid #EEE;">${item.product_name}</td>
            <td style="padding:10px 12px;color:#1B2E4A;text-align:center;border-bottom:1px solid #EEE;">×${item.quantity}</td>
            <td style="padding:10px 12px;color:#1B2E4A;text-align:right;border-bottom:1px solid #EEE;">₹${(Number(item.price) * item.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')

        await resend.emails.send({
          from: 'KalaStree <team@kalastree.com>',
          to: order.user_email,
          subject: `Order Confirmed #${shortId} — KalaStree`,
          html: `
            <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
              <div style="text-align:center;margin-bottom:24px;">
                <h1 style="font-size:28px;color:#E8380A;margin:0;">Kala<em style="color:#D4A000;">Stree</em></h1>
                <p style="color:#6B4820;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0;">Heritage by Her</p>
              </div>
              <h2 style="color:#1B2E4A;font-size:22px;">Thank you, ${order.user_name}! 🙏</h2>
              <p style="color:#6B4820;line-height:1.8;">Your order has been confirmed and payment received. Our artisans will begin preparing your handcrafted items.</p>
              <div style="background:#fff;border:1px solid #DDB840;border-radius:8px;margin:20px 0;overflow:hidden;">
                <div style="background:#1B2E4A;padding:12px 16px;">
                  <p style="margin:0;color:#D4A000;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Order #${shortId}</p>
                </div>
                <table style="width:100%;border-collapse:collapse;">
                  <thead>
                    <tr style="background:#FFF3D0;">
                      <th style="padding:10px 12px;text-align:left;color:#6B4820;font-size:13px;">Item</th>
                      <th style="padding:10px 12px;text-align:center;color:#6B4820;font-size:13px;">Qty</th>
                      <th style="padding:10px 12px;text-align:right;color:#6B4820;font-size:13px;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                  <tfoot>
                    <tr style="background:#FFF3D0;">
                      <td colspan="2" style="padding:12px;color:#1B2E4A;font-weight:bold;font-size:15px;">Total Paid</td>
                      <td style="padding:12px;color:#E8380A;font-weight:bold;font-size:15px;text-align:right;">₹${Number(order.total).toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              ${order.address_line ? `
              <div style="background:#FFE8A8;border-left:4px solid #E8380A;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;">
                <p style="margin:0 0 4px;color:#1B2E4A;font-weight:bold;font-size:13px;">Delivering to</p>
                <p style="margin:0;color:#6B4820;line-height:1.7;">${order.address_line}<br/>${order.city}, ${order.state} — ${order.pincode}</p>
              </div>` : ''}
              <p style="color:#6B4820;line-height:1.8;margin-top:20px;">Questions? Reply to this email or write to <a href="mailto:garima@kalastree.com" style="color:#E8380A;">garima@kalastree.com</a></p>
              <hr style="border:none;border-top:1px solid #DDB840;margin:24px 0;"/>
              <p style="color:#A07840;font-size:12px;text-align:center;">KalaStree · India's first GI-verified marketplace for women artisans<br/><em>"Heritage by Her"</em></p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.error('Order confirmation email failed:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('verify-payment error:', err)
    return NextResponse.json({ success: false, error: err.message })
  }
}
