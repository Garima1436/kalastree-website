import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#F9F0D0', color: '#B8860B' },
  paid:       { bg: '#E8F0E4', color: '#3B5A2F' },
  processing: { bg: '#E8ECF2', color: '#1B2E4A' },
  shipped:    { bg: '#dbeafe', color: '#1d4ed8' },
  delivered:  { bg: '#E8F0E4', color: '#3B5A2F' },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C' },
}

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered']

export default async function MyOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)', padding: '3rem 5%' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
            My Orders
          </h1>
          <Link href="/shop" style={{ fontSize: '0.85rem', color: '#C94B1A', fontWeight: 700, textDecoration: 'none' }}>
            Continue shopping →
          </Link>
        </div>

        {(!orders || orders.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#5C5542' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', marginBottom: '1.5rem' }}>No orders yet.</p>
            <Link href="/shop" style={{ background: '#C94B1A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
              Shop GI Products →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order: any) => {
              const sc = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending
              const stepIndex = STATUS_STEPS.indexOf(order.status)
              return (
                <div key={order.id} style={{ background: '#FFFEF9', border: '1.5px solid #D9C9A8', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ background: '#F2E8D5', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#5C5542' }}>
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9A8E7A', marginTop: 2 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', background: sc.bg, color: sc.color }}>
                        {order.status.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700, color: '#C94B1A' }}>
                        ₹{Number(order.total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    {/* Progress bar */}
                    {order.status !== 'cancelled' && (
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: 0 }}>
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%', border: `2px solid ${i <= stepIndex ? '#C94B1A' : '#D9C9A8'}`,
                                background: i <= stepIndex ? '#C94B1A' : '#FFFEF9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: i <= stepIndex ? '#fff' : '#D9C9A8', fontWeight: 700,
                              }}>
                                {i < stepIndex ? '✓' : i + 1}
                              </div>
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: i <= stepIndex ? '#C94B1A' : '#9A8E7A', whiteSpace: 'nowrap' }}>
                                {step}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div style={{ flex: 1, height: 2, background: i < stepIndex ? '#C94B1A' : '#D9C9A8', margin: '0 4px', marginBottom: 16 }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(order.order_items ?? []).map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                          <span style={{ color: '#1B2E4A' }}>{item.product_name} × {item.quantity}</span>
                          <span style={{ fontWeight: 700, color: '#C94B1A' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
