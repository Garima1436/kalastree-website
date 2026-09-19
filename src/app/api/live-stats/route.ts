import { NextResponse } from 'next/server'
import { getGa, gaConfigProblem } from '@/lib/ga'

// Live numbers for the top-bar pill, read from Google Analytics' Data API.
// Needs two server-only env vars: GA_PROPERTY_ID (the numeric property id, not G-XXXX)
// and GA_SERVICE_ACCOUNT_JSON (the service account key, as JSON). Without them — or if
// Google can't be reached — this reports { enabled: false } and the pill stays hidden.

const CACHE_MS = 60_000
let cached: { at: number; body: { online: number; today: number } } | null = null

export async function GET() {
  const ga = getGa()
  if (!ga) return NextResponse.json({ enabled: false, reason: gaConfigProblem() })

  // One Google call per minute no matter how many visitors are on the site.
  if (cached && Date.now() - cached.at < CACHE_MS) return NextResponse.json({ enabled: true, ...cached.body })

  try {
    const { client, property } = ga
    const [[realtime], [daily]] = await Promise.all([
      // People active in the last 5 minutes.
      client.runRealtimeReport({
        property,
        metrics: [{ name: 'activeUsers' }],
        minuteRanges: [{ startMinutesAgo: 4, endMinutesAgo: 0 }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
      }),
    ])
    const online = Number(realtime.rows?.[0]?.metricValues?.[0]?.value ?? 0)
    const today = Number(daily.rows?.[0]?.metricValues?.[0]?.value ?? 0)
    cached = { at: Date.now(), body: { online, today } }
    return NextResponse.json({ enabled: true, online, today })
  } catch (err) {
    console.error('GA live stats failed:', err instanceof Error ? err.message : err)
    // Serve the last good numbers rather than hiding the pill on a brief hiccup.
    return NextResponse.json(cached ? { enabled: true, ...cached.body } : { enabled: false })
  }
}
