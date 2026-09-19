import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { assertAdmin } from '../assertAdmin'
import { isUuid } from '@/lib/careersValidation'
import type { JobApplication, JobOpening } from '@/lib/careers'
import ApplicationActions from './ApplicationActions'

const pill = { new: ['#FEF3C7', '#92400E'], shortlisted: ['#C8F5D8', '#1A7A32'], rejected: ['#F3F4F6', '#6B7280'] } as const

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  await assertAdmin()
  const { job } = await searchParams
  const jobFilter = job && isUuid(job) ? job : ''

  let query = supabaseAdmin.from('job_applications').select('*').order('created_at', { ascending: false })
  if (jobFilter) query = query.eq('job_id', jobFilter)
  const [{ data, error }, { data: jobs }] = await Promise.all([
    query,
    supabaseAdmin.from('job_openings').select('id, title').order('created_at', { ascending: false }),
  ])
  const items = (data ?? []) as JobApplication[]
  const openings = (jobs ?? []) as Pick<JobOpening, 'id' | 'title'>[]
  const newCount = items.filter(i => i.status === 'new').length
  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: '2rem', fontWeight: 700, color: '#1B2E4A' }}>Applications</h1>
          <div style={{ fontSize: '0.78rem', color: '#6B4820', marginTop: 4 }}>
            {items.length} application{items.length === 1 ? '' : 's'} · {newCount} new
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <form method="get" style={{ display: 'flex', gap: 8 }}>
            <select name="job" defaultValue={jobFilter} style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid #DDB840', background: '#fff', color: '#1B2E4A', maxWidth: 260 }}>
              <option value="">All positions</option>
              {openings.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
            <button type="submit" style={{ background: '#1B2E4A', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Filter</button>
          </form>
          <Link href="/admin/careers" style={{ color: '#6B4820', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>← Positions</Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 6, padding: '12px 16px', color: '#B91C1C', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Could not load applications: {error.message}. If this is the first time using this page, run
          <code> supabase/migrations/20260919120000_add_job_applications.sql </code> in the Supabase SQL editor.
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1.5px solid #DDB840', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 900 }}>
          <thead style={{ background: '#FFE8A8' }}>
            <tr>
              {['Received', 'Applicant', 'Role', 'Resume', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B4820', fontSize: '0.7rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid #FFE8A8', verticalAlign: 'top' }}>
                <td style={{ padding: '12px 16px', color: '#6B4820', whiteSpace: 'nowrap' }}>{fmt(a.created_at)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1B2E4A' }}>{a.name}</div>
                  <div><a href={`mailto:${a.email}`} style={{ color: '#6B4820' }}>{a.email}</a></div>
                  <div style={{ color: '#6B4820' }}>{a.phone} · {a.location}</div>
                  {a.link && /^https?:\/\//i.test(a.link) && (
                    <div><a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1A7A32' }}>Link ↗</a></div>
                  )}
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ cursor: 'pointer', color: '#E8380A', fontSize: '0.8rem', fontWeight: 600 }}>Message</summary>
                    <p style={{ whiteSpace: 'pre-wrap', color: '#6B4820', lineHeight: 1.6, maxWidth: 380, marginTop: 6 }}>{a.message}</p>
                  </details>
                </td>
                <td style={{ padding: '12px 16px', color: '#1B2E4A', maxWidth: 220 }}>{a.role}</td>
                <td style={{ padding: '12px 16px' }}>
                  {a.resume_path
                    ? <a href={`/api/admin/careers/applications/${a.id}/resume`} style={{ color: '#1A7A32', fontWeight: 700 }}>Download</a>
                    : <span style={{ color: '#9CA3AF' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: pill[a.status][0], color: pill[a.status][1], padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'inline-block', marginBottom: 8 }}>{a.status}</span>
                  <ApplicationActions id={a.id} status={a.status} />
                </td>
              </tr>
            ))}
            {items.length === 0 && !error && (
              <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#6B4820' }}>No applications yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
