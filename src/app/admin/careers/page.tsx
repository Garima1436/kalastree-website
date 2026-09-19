import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { assertAdmin } from './assertAdmin'
import { EMPLOYMENT_TYPE_LABELS, type JobOpening } from '@/lib/careers'
import DeleteOpeningButton from './DeleteOpeningButton'
import OpeningVisibilityToggle from './OpeningVisibilityToggle'

export default async function AdminCareersPage() {
  await assertAdmin()

  const { data, error } = await supabaseAdmin
    .from('job_openings')
    .select('*')
    .order('created_at', { ascending: false })
  const items = (data ?? []) as JobOpening[]
  const liveCount = items.filter(i => i.is_active).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>
            Careers
          </h1>
          <div style={{ fontSize: '0.78rem', color: '#6B4820', marginTop: 4 }}>
            {items.length} position{items.length === 1 ? '' : 's'} · {liveCount} live on the Careers page
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/admin/careers/applications" style={{ border: '1.5px solid #1B2E4A', color: '#1B2E4A', padding: '9px 18px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          Applications
        </Link>
        <Link href="/admin/careers/new" style={{ background: '#E8380A', color: '#fff', padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
          + Add Position
        </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '12px 16px', color: '#B91C1C', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Could not load positions: {error.message}. If this is the first time using this page, the
          <code> job_openings </code> table may not exist yet — run
          <code> supabase/migrations/20260919100000_add_job_openings.sql </code> in the Supabase SQL editor.
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 700 }}>
          <thead style={{ background: '#FFE8A8' }}>
            <tr>
              {['Title', 'Location', 'Type', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderTop: '1px solid #FFE8A8' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1B2E4A', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                </td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>{item.location}</td>
                <td style={{ padding: '12px 16px', color: '#6B4820' }}>{EMPLOYMENT_TYPE_LABELS[item.employment_type] ?? item.employment_type}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: item.is_active ? '#C8F5D8' : '#F3F3F3', color: item.is_active ? '#1A7A32' : '#777',
                  }}>
                    {item.is_active ? 'Live' : 'Hidden'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/admin/careers/${item.id}/edit`} style={{ fontSize: '0.78rem', color: '#1B2E4A', fontWeight: 700, textDecoration: 'none', border: '1px solid #DDB840', padding: '4px 10px', borderRadius: 4 }}>
                      Edit
                    </Link>
                    <OpeningVisibilityToggle id={item.id} isActive={item.is_active} />
                    <DeleteOpeningButton id={item.id} title={item.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!error && items.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B4820' }}>
            No positions yet — the Careers page shows &ldquo;No open positions right now&rdquo;.{' '}
            <Link href="/admin/careers/new" style={{ color: '#E8380A', fontWeight: 700 }}>Add the first one</Link>
          </div>
        )}
      </div>
    </div>
  )
}
