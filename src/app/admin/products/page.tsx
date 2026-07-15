import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeleteProductButton from './DeleteProductButton'
import ApproveRejectButtons from './ApproveRejectButtons'
import { getServerLang } from '@/lib/i18n/server'
import { Lang } from '@/lib/i18n/constants'
import dict from '@/lib/i18n/dictionaries/adminProducts'
import commonDict from '@/lib/i18n/dictionaries/common'

function getT(lang: Lang) {
  return (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
}
function getCommonT(lang: Lang) {
  return (key: keyof typeof commonDict.en): string => commonDict[lang]?.[key] ?? commonDict.en[key]
}

export default async function AdminProductsPage() {
  const lang = await getServerLang()
  const t = getT(lang)
  const tc = getCommonT(lang)
  const statusLabel: Record<string, string> = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  }
  const categoryLabel: Record<string, string> = {
    textile: t('categoryTextile'),
    handicraft: t('categoryHandicraft'),
    agricultural: t('categoryAgricultural'),
    food: t('categoryFood'),
  }
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, artisan:artisans(name)')
    .order('created_at', { ascending: false })

  const pending = (products ?? []).filter((p: any) => p.status === 'pending')
  const rest = (products ?? []).filter((p: any) => p.status !== 'pending')

  const row = (p: any, showApprove = false) => (
    <tr key={p.id} style={{ borderTop: '1px solid #FFE8A8' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: 600, color: '#1B2E4A', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <div style={{ fontSize: '0.7rem', color: '#E8380A', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>PROD-{String(p.serial_no ?? 0).padStart(3, '0')}</div>
        <div style={{ fontSize: '0.72rem', color: '#D4A000', marginTop: 1 }}>{p.gi_tag ?? '—'}</div>
      </td>
      <td style={{ padding: '12px 16px', color: '#6B4820' }}>{(p.artisan as any)?.name ?? '—'}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ background: '#FFE8A8', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B4820' }}>{categoryLabel[p.category] ?? p.category}</span>
      </td>
      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8380A' }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
      <td style={{ padding: '12px 16px', fontWeight: 700, color: p.stock === 0 ? '#EF4444' : '#1A7A32' }}>{p.stock}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
          background: p.status === 'approved' ? '#C8F5D8' : p.status === 'rejected' ? '#FEE2E2' : '#FFF3CD',
          color: p.status === 'approved' ? '#1A7A32' : p.status === 'rejected' ? '#B91C1C' : '#D4A000',
        }}>
          {statusLabel[p.status ?? 'approved'] ?? p.status}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {showApprove && <ApproveRejectButtons id={p.id} />}
          <Link href={`/admin/products/${p.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4, textDecoration: 'none' }}>{tc('edit')}</Link>
          <DeleteProductButton id={p.id} name={p.name} />
        </div>
      </td>
    </tr>
  )

  const tableHead = (
    <thead style={{ background: '#FFE8A8' }}>
      <tr>
        {[t('thProduct'), t('thArtisan'), t('thCategory'), tc('price'), t('thStock'), tc('status'), tc('actions')].map(h => (
          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>{h}</th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>{t('pageTitle')}</h1>
        <Link href="/admin/products/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>{t('addProductBtn')}</Link>
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
            <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.4rem', fontWeight: 700, color: '#D4A000', margin: 0 }}>
              ⏳ {t('pendingApprovalHeading')}
            </h2>
            <span style={{ background: '#FFF3CD', color: '#D4A000', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, border: '1px solid #D4A00050' }}>
              {pending.length} {pending.length !== 1 ? t('productPlural') : t('productSingular')}
            </span>
          </div>
          <div style={{ background: '#FFFFFF', border: '2px solid #D4A000', borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 700 }}>
              {tableHead}
              <tbody>{pending.map((p: any) => row(p, true))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #FFE8A8' }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.3rem', fontWeight: 600, color: '#1B2E4A', margin: 0 }}>
            {t('allProductsHeading')} ({rest.length})
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 700 }}>
          {tableHead}
          <tbody>{rest.map((p: any) => row(p, false))}</tbody>
        </table>
        {rest.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B4820' }}>
            {t('noProductsYet')} <Link href="/admin/products/new" style={{ color: '#E8380A', fontWeight: 700 }}>{t('addFirstProductArrow')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}
