import { createClient } from '@/lib/supabase-server'
import SyncRemittanceButton from './SyncRemittanceButton'
import { getServerLang } from '@/lib/i18n/server'
import { Lang } from '@/lib/i18n/constants'
import dict from '@/lib/i18n/dictionaries/adminRemittance'

function getT(lang: Lang) {
  return (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
}

export default async function AdminRemittancePage() {
  const lang = await getServerLang()
  const t = getT(lang)
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, user_name, total, tracking_number, payments(status, remitted_amount, remitted_at)')
    .eq('payment_method', 'cod')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A', marginBottom: '0.4rem' }}>
        {t('pageTitle')}
      </h1>
      <p style={{ color: '#6B4820', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
        {t('pageSubtitle')}
      </p>

      <SyncRemittanceButton />

      {(!orders || orders.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6B4820', background: '#fff', border: '1.5px solid #DDB840', borderRadius: 10 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💵</div>
          <p>{t('noOrdersYet')}</p>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FFE8A8' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#6B4820' }}>{t('thOrder')}</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#6B4820' }}>{t('thCustomer')}</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.72rem', color: '#6B4820' }}>{t('thTotal')}</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#6B4820' }}>{t('thAwb')}</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#6B4820' }}>{t('thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => {
                const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
                const collected = payment?.status === 'cod_collected'
                return (
                  <tr key={order.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6B4820' }}>
                      #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#1B2E4A' }}>{order.user_name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#E8380A' }}>
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6B4820' }}>
                      {order.tracking_number ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                      {collected ? (
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#C8F5D8', color: '#1A7A32', fontWeight: 700, fontSize: '0.72rem' }}>
                          {t('statusCollectedPrefix')}{Number(payment.remitted_amount).toLocaleString('en-IN')}
                          {payment.remitted_at ? ` ${t('onLabel')} ${new Date(payment.remitted_at).toLocaleDateString('en-IN')}` : ''}
                        </span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#FFF3A8', color: '#D4A000', fontWeight: 700, fontSize: '0.72rem' }}>
                          {t('statusPending')}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
