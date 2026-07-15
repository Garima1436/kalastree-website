import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { getServerLang } from '@/lib/i18n/server'
import artisanDashboard from '@/lib/i18n/dictionaries/artisanDashboard'
import common from '@/lib/i18n/dictionaries/common'

const statusStyle: Record<string, { bg: string; color: string; icon: string; labelKey: keyof typeof artisanDashboard.en }> = {
  pending:  { bg: '#FFF3CD', color: '#D4A000', icon: '⏳', labelKey: 'statusPendingWord' },
  approved: { bg: '#C8F5D8', color: '#1A7A32', icon: '✓', labelKey: 'statusLiveWord' },
  rejected: { bg: '#FEE2E2', color: '#B91C1C', icon: '✗', labelKey: 'statusRejectedWord' },
}

export default async function ArtisanProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const lang = await getServerLang()
  const t = (k: keyof typeof artisanDashboard.en) => artisanDashboard[lang][k] ?? artisanDashboard.en[k]
  const tc = (k: keyof typeof common.en) => common[lang][k] ?? common.en[k]

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('submitted_by', user!.id)
    .order('created_at', { ascending: false })

  const tableHeaders = [
    t('colProduct'), tc('price'), t('colStock'), tc('status'), t('colSubmitted'), tc('actions'),
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
          {t('myProducts')}
        </h1>
        <Link href="/artisan/products/new" style={{ background: '#1A7A32', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + {t('addProduct')}
        </Link>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #86EFAC', borderRadius: 10, overflow: 'auto' }}>
        {products && products.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 600 }}>
            <thead style={{ background: '#F0FFF4' }}>
              <tr>
                {tableHeaders.map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1A7A32', fontSize: '0.7rem' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const s = statusStyle[p.status ?? 'pending'] ?? statusStyle.pending
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #D1FAE5' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid #86EFAC' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1B2E4A' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#6B4820' }}>{p.category}</div>
                          {p.status === 'approved' && p.serial_no && (
                            <div style={{ fontSize: '0.68rem', color: '#E8380A', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
                              PROD-{String(p.serial_no).padStart(3, '0')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8380A' }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', color: p.stock === 0 ? '#EF4444' : '#1B2E4A', fontWeight: 600 }}>{p.stock}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }}>
                        {s.icon} {t(s.labelKey)}
                      </span>
                      {p.status === 'rejected' && p.rejection_note && (
                        <div style={{ fontSize: '0.68rem', color: '#B91C1C', marginTop: 4, maxWidth: 200 }}>{p.rejection_note}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B4820', fontSize: '0.8rem' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/artisan/products/${p.id}/edit`} style={{ fontSize: '0.78rem', color: '#1A7A32', fontWeight: 700, border: '1px solid #86EFAC', padding: '4px 10px', borderRadius: 4, textDecoration: 'none' }}>
                        {tc('edit')}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#1A7A32' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏺</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', marginBottom: '1.5rem' }}>{t('noProductsYet')}</p>
            <Link href="/artisan/products/new" style={{ background: '#1A7A32', color: '#fff', padding: '10px 24px', borderRadius: 6, fontWeight: 700, textDecoration: 'none' }}>
              {t('addFirstProduct')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
