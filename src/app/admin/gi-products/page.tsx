import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteGIProductButton from './DeleteGIProductButton'
import { getServerLang, getT } from '@/lib/i18n/server'

export default async function AdminGIProductsPage() {
  const lang = await getServerLang()
  const t = getT('adminGiProducts', lang)
  const tc = getT('common', lang)
  const supabase = await createClient()
  const { data: giProducts } = await supabase
    .from('gi_products')
    .select('*')
    .order('state', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
            {t('heading')}
          </h1>
          <div style={{ fontSize: '0.78rem', color: '#6B4820', marginTop: 4 }}>
            {giProducts ? giProducts.length : 0} {t('giProductCountLabel')}{lang === 'en' && giProducts?.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Link href="/admin/gi-products/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          {t('addGiProduct')}
        </Link>
      </div>

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 800 }}>
          <thead style={{ background: '#FFE8A8' }}>
            <tr>
              {[t('colPhoto'), t('colName'), t('colState'), t('colCategory'), t('colWomenPercent'), t('colGiTag'), t('colYear'), t('colActions')].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(giProducts ?? []).map((p: any) => (
              <tr key={p.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: '#FFE8A8', border: '1.5px solid #DDB840', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '1.4rem' }}>{p.emoji ?? '🗺️'}</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1B2E4A', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.tagline && (
                    <div style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tagline}</div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>
                  <div>{p.state ?? '—'}</div>
                  {p.district && <div style={{ fontSize: '0.72rem', color: '#A07840', marginTop: 2 }}>{p.district}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#FFE8A8', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B4820' }}>
                    {p.category ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1A7A32' }}>
                  {p.women_percent != null ? `${p.women_percent}%` : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#D4A000', fontWeight: 600 }}>
                  {p.gi_tag ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>
                  {p.year ?? '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin/gi-products/${p.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, textDecoration: 'none', border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4 }}>
                      {tc('edit')}
                    </Link>
                    <DeleteGIProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!giProducts || giProducts.length === 0) && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B4820' }}>
            {t('emptyText')}{' '}
            <Link href="/admin/gi-products/new" style={{ color: '#E8380A', fontWeight: 700 }}>{t('addFirstGiProduct')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}
