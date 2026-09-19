import { getGa } from './ga'

// Data behind the public /stats page. Everything is aggregate (counts by page, country,
// source, device) — no per-visitor data — and pages that can carry private ids or
// account details are left out of "top pages".

export const PERIODS = ['today', '7d', '30d'] as const
export type Period = (typeof PERIODS)[number]

export interface StatsData {
  totals: { visitors: number; pageviews: number; sessions: number }
  series: { label: string; value: number }[]
  pages: { name: string; value: number }[]
  sources: { name: string; value: number }[]
  countries: { name: string; value: number }[]
  cities: { name: string; value: number }[]
  devices: { name: string; value: number }[]
}

const PRIVATE_PREFIXES = ['/admin', '/account', '/order', '/checkout', '/api', '/login', '/signup', '/reset-password', '/forgot-password', '/auth']
const CACHE_MS = 5 * 60_000
const cache = new Map<Period, { at: number; data: StatsData }>()

// The GA property reports in India time, so "today" and hour buckets are IST.
function istNow() {
  return new Date(Date.now() + 5.5 * 3600_000)
}
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

export async function getStats(period: Period): Promise<StatsData | null> {
  const ga = getGa()
  if (!ga) return null
  const hit = cache.get(period)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

  const { client, property } = ga
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 1
  const dateRanges = [{ startDate: period === 'today' ? 'today' : `${days - 1}daysAgo`, endDate: 'today' }]
  const userMetric = [{ name: 'activeUsers' }]

  const breakdown = async (dimension: string, metric: string, filter?: object) => {
    const [r] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: dimension }],
      metrics: [{ name: metric }],
      orderBys: [{ metric: { metricName: metric }, desc: true }],
      limit: 8,
      ...(filter ? { dimensionFilter: filter } : {}),
    })
    return (r.rows ?? []).map(row => ({
      name: row.dimensionValues?.[0]?.value || '(not set)',
      value: Number(row.metricValues?.[0]?.value ?? 0),
    }))
  }

  const notPrivate = {
    notExpression: {
      orGroup: {
        expressions: PRIVATE_PREFIXES.map(p => ({
          filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH' as const, value: p } },
        })),
      },
    },
  }

  try {
    const [[totalsRes], [seriesRes], pages, sources, countries, cities, devices] = await Promise.all([
      client.runReport({ property, dateRanges, metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }] }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: period === 'today' ? 'dateHour' : 'date' }],
        metrics: userMetric,
      }),
      breakdown('pagePath', 'screenPageViews', notPrivate),
      breakdown('sessionSource', 'sessions'),
      breakdown('country', 'activeUsers'),
      // Indian cities only: the list stays meaningful and a city name isn't shown without its country.
      breakdown('city', 'activeUsers', { filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT' as const, value: 'India' } } }),
      breakdown('deviceCategory', 'activeUsers'),
    ])

    const t = totalsRes.rows?.[0]?.metricValues ?? []
    const byKey = new Map((seriesRes.rows ?? []).map(r => [r.dimensionValues?.[0]?.value ?? '', Number(r.metricValues?.[0]?.value ?? 0)]))

    const now = istNow()
    const series: StatsData['series'] = []
    if (period === 'today') {
      const day = ymd(now)
      for (let h = 0; h < 24; h++) {
        const key = `${day}${String(h).padStart(2, '0')}`
        series.push({ label: `${String(h).padStart(2, '0')}:00`, value: byKey.get(key) ?? 0 })
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86_400_000)
        series.push({
          label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
          value: byKey.get(ymd(d)) ?? 0,
        })
      }
    }

    const data: StatsData = {
      totals: { visitors: Number(t[0]?.value ?? 0), pageviews: Number(t[1]?.value ?? 0), sessions: Number(t[2]?.value ?? 0) },
      series,
      pages,
      sources: sources.map(s => ({ ...s, name: s.name === '(direct)' ? 'Direct' : s.name })),
      countries,
      cities,
      devices,
    }
    cache.set(period, { at: Date.now(), data })
    return data
  } catch (err) {
    console.error('GA stats failed:', err instanceof Error ? err.message : err)
    return hit?.data ?? null
  }
}
