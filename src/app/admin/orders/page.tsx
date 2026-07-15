import { createClient } from '@/lib/supabase-server'
import UpdateOrderStatus from './UpdateOrderStatus'
import { getServerLang } from '@/lib/i18n/server'
import { Lang } from '@/lib/i18n/constants'
import dict from '@/lib/i18n/dictionaries/adminOrders'

function getT(lang: Lang) {
  return (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#FFF3A8', color: '#D4A000' },
  paid:       { bg: '#C8F5D8', color: '#1A7A32' },
  processing: { bg: '#E0EAFF', color: '#1B2E4A' },
  shipped:    { bg: '#dbeafe', color: '#1d4ed8' },
  delivered:  { bg: '#C8F5D8', color: '#1A7A32' },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C' },
}

export default async function AdminOrdersPage() {
  const lang = await getServerLang()
  const t = getT(lang)
  const statusLabel: Record<string, string> = {
    pending: t('statusPending'),
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
                    <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                      {(statusLabel[order.status] ?? order.status).toUpperCase()}
                    </span>
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
