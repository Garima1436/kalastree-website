import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { getServerLang, getT } from '@/lib/i18n/server'

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#FFF3A8', color: '#D4A000' },
  paid:       { bg: '#C8F5D8', color: '#1A7A32' },
  processing: { bg: '#E0EAFF', color: '#1B2E4A' },
  shipped:    { bg: '#dbeafe', color: '#1d4ed8' },
  delivered:  { bg: '#C8F5D8', color: '#1A7A32' },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C' },
}

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered']

const STATUS_LABEL_KEY = {
  pending: 'statusPending',
  paid: 'statusPaid',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
} as const

export default async function MyOrdersPage() {
  const lang = await getServerLang()
  const t = getT('shopping', lang)
  const tc = getT('common', lang)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const statusLabel = (status: string) => {
    const key = STATUS_LABEL_KEY[status as keyof typeof STATUS_LABEL_KEY]
    return key ? t(key) : status.toUpperCase()
  }

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)', padding: '3rem 5%' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
            {tc('myOrders')}
          </h1>
          <Link href="/shop" style={{ fontSize: '0.85rem', color: '#E8380A', fontWeight: 700, textDecoration: 'none' }}>
            {t('continueShoppingArrow')} →
          </Link>
        </div>

        {(!orders || orders.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B4820' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', marginBottom: '1.5rem' }}>{t('noOrdersYet')}</p>
            <Link href="/shop" style={{ background: '#E8380A', color: '#fff', padding: '12px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
              {t('shopGiProducts')} →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order: any) => {
              const sc = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending
              const stepIndex = STATUS_STEPS.indexOf(order.status)
              return (
                <div key={order.id} style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ background: '#FFE8A8', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B4820' }}>
                        {t('orderNumberLabel')}{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#A07840', marginTop: 2 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', background: sc.bg, color: sc.color }}>
                        {statusLabel(order.status)}
                      </span>
                      <span style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700, color: '#E8380A' }}>
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
                                width: 24, height: 24, borderRadius: '50%', border: `2px solid ${i <= stepIndex ? '#E8380A' : '#DDB840'}`,
                                background: i <= stepIndex ? '#E8380A' : '#FFFFFF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: i <= stepIndex ? '#fff' : '#DDB840', fontWeight: 700,
                              }}>
                                {i < stepIndex ? '✓' : i + 1}
                              </div>
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: i <= stepIndex ? '#E8380A' : '#A07840', whiteSpace: 'nowrap' }}>
                                {statusLabel(step)}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div style={{ flex: 1, height: 2, background: i < stepIndex ? '#E8380A' : '#DDB840', margin: '0 4px', marginBottom: 16 }} />
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
                          <span style={{ fontWeight: 700, color: '#E8380A' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
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
