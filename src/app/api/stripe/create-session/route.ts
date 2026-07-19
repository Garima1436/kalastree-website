import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { items, name, email, phone, address, city, state, pincode } = await req.json()

    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    // Get logged-in user (optional — guest checkout is fine)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Recalculate total from DB prices — never trust client
    const productIds = items.map((i: any) => i.id)
    const { data: products } = await supabaseAdmin
      .from('products').select('id, name, price, stock, images').in('id', productIds)

    if (!products) return NextResponse.json({ error: 'Could not load products' }, { status: 500 })

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.id)
      if (!product) return NextResponse.json({ error: `Product not found` }, { status: 400 })
      if (product.stock < item.qty) return NextResponse.json({ error: `"${item.name}" is out of stock` }, { status: 400 })
    }

    const amount = items.reduce((sum: number, item: any) => {
      const product = products.find((p: any) => p.id === item.id)!
      return sum + Number(product.price) * item.qty
    }, 0)

    // Create order in DB
    const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert({
      user_id: user?.id ?? null,
      user_email: email,
      user_name: name,
      phone,
      total: amount,
      status: 'pending',
      address_line: address,
      city, state, pincode,
    }).select().single()

    if (orderError || !order) return NextResponse.json({ error: orderError?.message ?? 'Failed to create order' }, { status: 500 })

    // Create order items
    await supabaseAdmin.from('order_items').insert(
      items.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image ?? null,
        quantity: item.qty,
        price: products.find((p: any) => p.id === item.id)!.price,
      }))
    )

    // Build Stripe line items from real DB prices
    const lineItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.id)!
      const imageUrl = product.images?.[0] ?? null
      return {
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.name,
            ...(imageUrl ? { images: [imageUrl] } : {}),
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.qty,
      }
    })

    const origin = req.headers.get('origin') || req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: { orderId: order.id },
      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    })

    // Save payment record
    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      stripe_session_id: session.id,
      amount,
      currency: 'INR',
      status: 'created',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('stripe create-session error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create payment session' }, { status: 500 })
  }
}
