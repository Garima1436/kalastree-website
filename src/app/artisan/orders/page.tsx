import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import ArtisanOrderActions from './ArtisanOrderActions'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: '#FFF3CD', color: '#D4A000',  label: 'Pending' },
  paid:       { bg: '#C8F5D8', color: '#1A7A32',  label: 'New Order' },
  processing: { bg: '#E0EAFF', color: '#1B2E4A',  label: 'Accepted' },
  shipped:    { bg: '#dbeafe', color: '#1d4ed8',  label: 'Shipped' },
  delivered:  { bg: '#C8F5D8', color: '#1A7A32',  label: 'Delivered' },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C',  label: 'Cancelled' },
}

export default async function ArtisanOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get this artisan's product IDs
  const { data: myProducts } = await supabaseAdmin
    .from('products').select('id, name').eq('submitted_by', user!.id)
  const myProductIds = (myProducts ?? []).map((p: any) => p.id)

  if (myProductIds.length === 0) {
    return (
      <div>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '2rem' }}>My Orders</h1>
        <div style={{ background: '#fff', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '4rem', textAlign: 'center', color: '#1A7A32' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>No approved products yet — orders will appear here once your products go live.</p>
        </div>
      </div>
    )
  }

  // Get order_items that contain artisan's products
  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select('order_id, product_id, product_name, quantity, price')
    .in('product_id', myProductIds)

  const orderIds = [...new Set((orderItems ?? []).map((i: any) => i.order_id))]

  // Get those orders
  const { data: orders } = orderIds.length > 0
    ? await supabaseAdmin.from('orders').select('*').in('id', orderIds).order('created_at', { ascending: false })
    : { data: [] }

  // Map order items by order id for display
  const itemsByOrder: Record<string, any[]> = {}
  for (const item of orderItems ?? []) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push(item)
  }

  const newOrders = (orders ?? []).filter((o: any) => o.status === 'paid')
  const activeOrders = (orders ?? []).filter((o: any) => ['processing', 'shipped'].includes(o.status))
  const pastOrders = (orders ?? []).filter((o: any) => ['delivered', 'cancelled'].includes(o.status))

  const OrderCard = ({ order }: { order: any }) => {
    const sc = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
    const items = itemsByOrder[order.id] ?? []
    return (
      <div style={{ background: '#fff', border: `1.5px solid ${order.status === 'paid' ? '#1A7A32' : '#86EFAC'}`, borderRadius: 10, padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#6B4820', marginBottom: 4 }}>
              #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ fontWeight: 700, color: '#1B2E4A', fontSize: '1rem' }}>{order.user_name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6B4820' }}>{order.user_email}</div>
            {order.address_line && (
              <div style={{ fontSize: '0.75rem', color: '#6B4820', marginTop: 2 }}>
                📍 {order.address_line}, {order.city}, {order.state} – {order.pincode}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 4 }}>
              {new Date(order.created_at).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.6rem', fontWeight: 700, color: '#E8380A' }}>
              ₹{Number(order.total).toLocaleString('en-IN')}
            </div>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
              {sc.label}
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #D1FAE5', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {items.map((item: any, i: number) => (
              <span key={i} style={{ fontSize: '0.85rem', color: '#1B2E4A' }}>
                {item.quantity}× <strong>{item.product_name}</strong> — ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            ))}
          </div>
          <ArtisanOrderActions orderId={order.id} status={order.status} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '2rem' }}>
        My Orders
      </h1>

      {(orders ?? []).length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '4rem', textAlign: 'center', color: '#1A7A32' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem' }}>No orders yet for your products.</p>
        </div>
      ) : (
        <>
          {newOrders.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', color: '#1A7A32', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                🔔 New Orders
                <span style={{ background: '#1A7A32', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700 }}>{newOrders.length}</span>
              </h2>
              {newOrders.map((o: any) => <OrderCard key={o.id} order={o} />)}
            </div>
          )}

          {activeOrders.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', color: '#1B2E4A', marginBottom: '1rem' }}>
                🚚 In Progress
              </h2>
              {activeOrders.map((o: any) => <OrderCard key={o.id} order={o} />)}
            </div>
          )}

          {pastOrders.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', color: '#A07840', marginBottom: '1rem' }}>
                📋 Past Orders
              </h2>
              {pastOrders.map((o: any) => <OrderCard key={o.id} order={o} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
