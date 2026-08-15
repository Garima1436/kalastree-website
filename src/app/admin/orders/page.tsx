import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import UpdateOrderStatus from './UpdateOrderStatus'
import { getServerLang } from '@/lib/i18n/server'
import { Lang } from '@/lib/i18n/constants'
import dict from '@/lib/i18n/dictionaries/adminOrders'

function getT(lang: Lang) {
  return (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#FFF3A8', color: '#D4A000' },
  confirmed:  { bg: '#C8F5D8', color: '#1A7A32' },
  paid:       { bg: '#C8F5D8', color: '#1A7A32' },
  processing: { bg: '#E0EAFF', color: '#1B2E4A' },
  shipped:    { bg: '#dbeafe', color: '#1d4ed8' },
  delivered:  { bg: '#C8F5D8', color: '#1A7A32' },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C' },
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  captured: 'PAID',
  refunded: 'REFUNDED',
  cod_pending: 'COD PENDING',
  cod_collected: 'COD COLLECTED',
  created: 'INITIATED',
  pending: 'INITIATED',
  failed: 'FAILED',
}

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  captured: { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  refunded: { bg: '#E0EAFF', color: '#1E3A8A', border: '#93C5FD' },
  cod_pending: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  cod_collected: { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  created: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  pending: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  failed: { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' },
}

export default async function AdminOrdersPage() {
  const lang = await getServerLang()
  const t = getT(lang)
  const statusLabel: Record<string, string> = {
    pending: t('statusPending'),
    confirmed: t('statusConfirmed'),
    paid: t('statusPaid'),
    processing: t('statusProcessing'),
    shipped: t('statusShipped'),
    delivered: t('statusDelivered'),
    cancelled: t('statusCancelled'),
  }
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  const orderIds = (orders ?? []).map((order: any) => order.id)
  const { data: payments } = orderIds.length > 0
    ? await supabaseAdmin
        .from('payments')
        .select('order_id, status')
        .in('order_id', orderIds)
    : { data: [] }

  const PAYMENT_STATUS_PRIORITY: Record<string, number> = {
    refunded: 70,
    captured: 60,
    cod_collected: 50,
    cod_pending: 40,
    created: 30,
    pending: 30,
    failed: 20,
  }

  const paymentStatusByOrder = new Map<string, string>()
  for (const payment of payments ?? []) {
    const current = paymentStatusByOrder.get(payment.order_id)
    const nextStatus = payment.status as string
    if (!current) {
      paymentStatusByOrder.set(payment.order_id, nextStatus)
      continue
    }
    const currentRank = PAYMENT_STATUS_PRIORITY[current] ?? 0
    const nextRank = PAYMENT_STATUS_PRIORITY[nextStatus] ?? 0
    if (nextRank >= currentRank) paymentStatusByOrder.set(payment.order_id, nextStatus)
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '2rem' }}>
        {t('pageTitle')}
      </h1>

      {(!orders || orders.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6B4820' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p>{t('noOrdersYet')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order: any) => {
            const sc = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending
            const paymentStatus = paymentStatusByOrder.get(order.id)
            const refundPendingManual = order.status === 'cancelled' && order.payment_method !== 'cod' && paymentStatus === 'captured'
            const paymentChip = paymentStatus ? (PAYMENT_STATUS_STYLE[paymentStatus] ?? PAYMENT_STATUS_STYLE.failed) : null
            const onlineChargedLifecycle = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'].includes(order.status)
            const paymentLabel = paymentStatus
              ? (PAYMENT_STATUS_LABEL[paymentStatus] ?? paymentStatus.toUpperCase())
              : (order.payment_method !== 'cod' && onlineChargedLifecycle ? 'PAID (RECORD MISSING)' : 'UNKNOWN')
            return (
              <div key={order.id} style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B4820', marginBottom: 4 }}>
                      #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, color: '#1B2E4A', fontSize: '1rem' }}>{order.user_name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6B4820' }}>{order.user_email}</div>
                    {order.address_line && (
                      <div style={{ fontSize: '0.78rem', color: '#6B4820', marginTop: 2 }}>
                        📍 {order.address_line}, {order.city}, {order.state} – {order.pincode}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#A07840', marginTop: 4 }}>
                      {new Date(order.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.7rem', fontWeight: 700, color: '#E8380A' }}>
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6B4820' }}>
                        {order.payment_method === 'cod' ? '💵 COD' : '💳 Online'}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          background: paymentChip?.bg ?? '#F3F4F6',
                          color: paymentChip?.color ?? '#374151',
                          border: `1px solid ${paymentChip?.border ?? '#D1D5DB'}`,
                        }}
                      >
                        {paymentLabel}
                      </span>
                      <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {(statusLabel[order.status] ?? order.status).toUpperCase()}
                      </span>
                    </div>
                    {refundPendingManual && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' }}>
                          REFUND PENDING - MANUAL ACTION REQUIRED
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #FFE8A8', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(order.order_items ?? []).map((item: any) => (
                      <span key={item.id} style={{ fontSize: '0.85rem', color: '#6B4820' }}>
                        {item.quantity}× {item.product_name} — ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    ))}
                  </div>
                  <UpdateOrderStatus id={order.id} currentStatus={order.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
