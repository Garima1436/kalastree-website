import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getRemittanceDetails } from '@/lib/ithink'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { error: null }
}

const MAX_RANGE_DAYS = 90

function* dateRange(from: string, to: string): Generator<string> {
  const start = new Date(from)
  const end = new Date(to)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    yield d.toISOString().slice(0, 10)
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { from, to } = await req.json()
  if (!from || !to) return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 })

  const days = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1
  if (days < 1 || days > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Date range must be between 1 and ${MAX_RANGE_DAYS} days` }, { status: 400 })
  }

  let matched = 0, alreadyReconciled = 0, unmatched = 0

  for (const date of dateRange(from, to)) {
    const records = await getRemittanceDetails(date)

    for (const record of records) {
      if (!record.awb) continue

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('tracking_number', record.awb)
        .eq('payment_method', 'cod')
        .maybeSingle()

      if (!order) { unmatched++; continue }

      const { data: payment } = await supabaseAdmin
        .from('payments').select('status').eq('order_id', order.id).maybeSingle()

      if (payment?.status === 'cod_collected') { alreadyReconciled++; continue }

      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'cod_collected',
          remitted_amount: record.amount,
          remitted_at: record.deliveredDate,
        })
        .eq('order_id', order.id)

      if (!updateError) matched++
    }
  }

  return NextResponse.json({ matched, alreadyReconciled, unmatched })
}
