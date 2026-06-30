import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSecret } from '@/lib/secrets'

export async function POST(req: NextRequest) {
  const [keyId, keySecret] = await Promise.all([
    getSecret('RAZORPAY_KEY_ID'),
    getSecret('RAZORPAY_KEY_SECRET'),
  ])
  if (!keyId || !keySecret) {
    console.error('Razorpay secrets missing from both process.env and SSM')
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
  }
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
  try {
    const body = await req.json()
    const { items, name, email, phone, address, city, state, pincode } = body

    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()

    // Recalculate total server-side from real DB prices — never trust client amount
    const productIds = items.map((i: any) => i.id)
    const { data: products, error: productError } = await supabaseAdmin
      .from('products').select('id, price, stock').in('id', productIds)
    if (productError || !products) return NextResponse.json({ error: 'Could not load products' }, { status: 500 })

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.id)
      if (!product) return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
      if (product.stock < item.qty) return NextResponse.json({ error: `"${item.name}" is out of stock` }, { status: 400 })
    }

    const amount = items.reduce((sum: number, item: any) => {
      const product = products.find((p: any) => p.id === item.id)!
      return sum + Number(product.price) * item.qty
    }, 0)

    // 1. Create order record in DB (admin client bypasses RLS — works for guests too)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        user_email: email,
        user_name: name,
        total: amount,
        status: 'pending',
        address_line: address,
        city, state, pincode,
      })
      .select()
      .single()

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

    // 2. Create order items
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

    // 3. Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: order.id.slice(0, 40),
    })

    // 4. Save payment record
    await supabase.from('payments').insert({
      order_id: order.id,
      razorpay_order_id: rzpOrder.id,
      amount,
      status: 'created',
    })

    return NextResponse.json({ razorpayOrderId: rzpOrder.id, orderId: order.id })
  } catch (err: any) {
    console.error('create-order error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create order' }, { status: 500 })
  }
}
