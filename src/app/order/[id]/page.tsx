import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerLang, getT } from '@/lib/i18n/server'

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const lang = await getServerLang()
  const t = getT('shopping', lang)

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  return (
    <div style={{ minHeight: '80vh', background: 'var(--parchment)', padding: '3rem 5%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.2rem', fontWeight: 700, color: '#1A7A32', marginBottom: '0.5rem' }}>
            {t('orderConfirmed')}
          </h1>
          <p style={{ color: '#6B4820', fontSize: '1rem', lineHeight: 1.7 }}>
            {t('thankYouPrefix')} <strong>{order.user_name}</strong>. {t('orderPlacedMessage')}
          </p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 12, padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#6B4820', marginBottom: '1.25rem', padding: '8px 12px', background: '#FFE8A8', borderRadius: 6, display: 'inline-block' }}>
            {t('orderNumberLabel')}{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
            {(order.order_items ?? []).map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                <span style={{ color: '#1B2E4A', fontWeight: 500 }}>{item.product_name} × {item.quantity}</span>
                <span style={{ fontWeight: 700, color: '#E8380A' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1.5px solid #DDB840', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
            <span>{t('totalPaid')}</span>
            <span style={{ color: '#E8380A' }}>₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>

          {order.address_line && (
            <div style={{ padding: '1rem', background: '#C8F5D8', borderRadius: 8, fontSize: '0.82rem', color: '#1A7A32', lineHeight: 1.7 }}>
              📦 {t('shippingTo')} <strong>{order.address_line}, {order.city}, {order.state} – {order.pincode}</strong>
            </div>
          )}
        </div>

        <div style={{ background: '#FFF3A8', border: '1px solid #D4A000', borderRadius: 8, padding: '1rem', marginBottom: '2rem', fontSize: '0.85rem', color: '#6B4820', lineHeight: 1.7 }}>
          🌾 {t('confirmationEmailPrefix')} <strong>{order.user_email}</strong>. {t('confirmationEmailSuffix')}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/account/orders" style={{ background: '#1B2E4A', color: '#fff', padding: '12px 24px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            {t('trackMyOrders')}
          </Link>
          <Link href="/shop" style={{ background: 'transparent', color: '#E8380A', padding: '12px 24px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', border: '2px solid #E8380A' }}>
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}
