import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { missingShippingFields } from '@/lib/checkoutValidation'

// Cash-on-Delivery order creation — the COD analog of
// razorpay/create-order + razorpay/verify combined into one synchronous
// request, since there's no payment gateway step to wait on.
export async function POST(req: NextRequest) {
  try {
    const { items, name, email, phone, address, city, state, pincode, checkoutGroupId } = await req.json()

    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    const missingFieldsError = missingShippingFields({ name, email, phone, address, city, state, pincode })
    if (missingFieldsError) return NextResponse.json({ error: missingFieldsError }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()

    // Re-validate server-side — never trust the client, and specifically
    // never trust that an item is COD-eligible just because the client says so.
    const productIds = items.map((i: any) => i.id)
    const { data: products, error: productError } = await supabaseAdmin
      .from('products').select('id, price, stock, cod_available').in('id', productIds)
    if (productError || !products) return NextResponse.json({ error: 'Could not load products' }, { status: 500 })

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.id)
      if (!product) return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
      if (product.stock < item.qty) return NextResponse.json({ error: `"${item.name}" is out of stock` }, { status: 400 })
      if (!product.cod_available) return NextResponse.json({ error: `"${item.name}" is not eligible for Cash on Delivery` }, { status: 400 })
    }

    const amount = items.reduce((sum: number, item: any) => {
      const product = products.find((p: any) => p.id === item.id)!
      return sum + Number(product.price) * item.qty
    }, 0)

    // COD orders have no gateway step, so they're created already "confirmed"
    // rather than "pending" — nothing is being awaited.
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        user_email: email,
        user_name: name,
        phone,
        total: amount,
        status: 'confirmed',
        address_line: address,
        city, state, pincode,
        payment_method: 'cod',
        checkout_group_id: checkoutGroupId ?? null,
      })
      .select()
      .single()

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

    await supabaseAdmin.from('order_items').insert(
      items.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image ?? null,
        quantity: item.qty,
        price: item.price,
      }))
    )

    // Decrement stock immediately — there's no separate capture step to wait for.
    await Promise.all(items.map((item: any) =>
      supabaseAdmin.rpc('decrement_stock', { p_product_id: item.id, p_qty: item.qty })
    ))

    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      amount,
      currency: 'INR',
      status: 'cod_pending',
      payment_method: 'cod',
    })

    // Send order confirmation email (non-blocking)
    try {
      const apiKey = process.env.RESEND_API_KEY
      if (email && apiKey) {
        const resend = new Resend(apiKey)
        const shortId = order.id.slice(0, 8).toUpperCase()
        const itemRows = items.map((item: any) => `
          <tr>
            <td style="padding:10px 12px;color:#1B2E4A;border-bottom:1px solid #EEE;">${item.name}</td>
            <td style="padding:10px 12px;color:#1B2E4A;text-align:center;border-bottom:1px solid #EEE;">×${item.qty}</td>
            <td style="padding:10px 12px;color:#1B2E4A;text-align:right;border-bottom:1px solid #EEE;">₹${(Number(item.price) * item.qty).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')

        await Promise.all([
          resend.emails.send({
            from: 'KalaStree <team@kalastree.com>',
            to: email,
            subject: `Order Confirmed #${shortId} — Cash on Delivery — KalaStree`,
            html: `
              <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#FFF8EE;border:1.5px solid #DDB840;border-radius:10px;">
                <div style="text-align:center;margin-bottom:24px;">
                  <h1 style="font-size:28px;color:#E8380A;margin:0;">Kala<em style="color:#D4A000;">Stree</em></h1>
                  <p style="color:#6B4820;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0;">Heritage by Her</p>
                </div>
                <h2 style="color:#1B2E4A;font-size:22px;">Thank you, ${name}! 🙏</h2>
                <p style="color:#6B4820;line-height:1.8;">Your order has been confirmed. Please keep the amount below ready — you'll pay in cash when it arrives. Our artisans will begin preparing your handcrafted items.</p>
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
                        <td colspan="2" style="padding:12px;color:#1B2E4A;font-weight:bold;font-size:15px;">Amount Due on Delivery</td>
                        <td style="padding:12px;color:#E8380A;font-weight:bold;font-size:15px;text-align:right;">₹${amount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                ${address ? `
                <div style="background:#FFE8A8;border-left:4px solid #E8380A;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;">
                  <p style="margin:0 0 4px;color:#1B2E4A;font-weight:bold;font-size:13px;">Delivering to</p>
                  <p style="margin:0;color:#6B4820;line-height:1.7;">${address}<br/>${city}, ${state} — ${pincode}</p>
                </div>` : ''}
                <p style="color:#6B4820;line-height:1.8;margin-top:20px;">Questions? Reply to this email or write to <a href="mailto:garima@kalastree.com" style="color:#E8380A;">garima@kalastree.com</a></p>
                <hr style="border:none;border-top:1px solid #DDB840;margin:24px 0;"/>
                <p style="color:#A07840;font-size:12px;text-align:center;">KalaStree · India's first GI-verified marketplace for women artisans<br/><em>"Heritage by Her"</em></p>
              </div>
            `,
          }),
          resend.emails.send({
            from: 'KalaStree Orders <team@kalastree.com>',
            to: ['garima@kalastree.com', 'iammishu1436@gmail.com'],
            cc: 'ashishkumar19975@gmail.com',
            subject: `New COD Order #${shortId} — ₹${amount.toLocaleString('en-IN')}`,
            html: `
              <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#1B2E4A;border-radius:10px;">
                <h2 style="color:#D4A000;margin-top:0;">New Cash on Delivery Order 🛍️💵</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                  ${[
                    ['Order ID', `#${shortId}`],
                    ['Customer', name],
                    ['Email', email],
                    ['Payment', 'Cash on Delivery'],
                    ['Total', `₹${amount.toLocaleString('en-IN')}`],
                    ...(city ? [['Ship to', `${city}, ${state} — ${pincode}`]] : []),
                  ].map(([k, v]: any) => `
                    <tr>
                      <td style="color:#D4A000;padding:8px 12px;font-size:13px;font-weight:bold;width:100px;vertical-align:top;">${k}</td>
                      <td style="color:#fff;padding:8px 12px;font-size:14px;">${v}</td>
                    </tr>
                  `).join('')}
                </table>
                <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.05);border-radius:6px;">
                  <thead>
                    <tr>
                      <th style="padding:10px 12px;text-align:left;color:#D4A000;font-size:12px;">Item</th>
                      <th style="padding:10px 12px;text-align:center;color:#D4A000;font-size:12px;">Qty</th>
                      <th style="padding:10px 12px;text-align:right;color:#D4A000;font-size:12px;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((item: any) => `
                      <tr>
                        <td style="padding:8px 12px;color:#fff;font-size:13px;">${item.name}</td>
                        <td style="padding:8px 12px;color:#fff;font-size:13px;text-align:center;">×${item.qty}</td>
                        <td style="padding:8px 12px;color:#fff;font-size:13px;text-align:right;">₹${(Number(item.price) * item.qty).toLocaleString('en-IN')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `,
          }),
        ])
      }
    } catch (emailErr) {
      console.error('COD order confirmation email failed:', emailErr)
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (err: any) {
    console.error('cod order-create error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create order' }, { status: 500 })
  }
}
