import { BetaAnalyticsDataClient } from '@google-analytics/data'

// Shared Google Analytics Data API client for the live pill and the public /stats page.
// Needs GA_PROPERTY_ID (numeric) and GA_SERVICE_ACCOUNT_JSON (server-only). Without
// them getGa() returns null and callers simply show nothing.

let client: BetaAnalyticsDataClient | null = null

export function getGa(): { client: BetaAnalyticsDataClient; property: string } | null {
  const propertyId = process.env.GA_PROPERTY_ID
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON
  if (!propertyId || !raw) return null
  if (!client) {
    try {
      client = new BetaAnalyticsDataClient({ credentials: JSON.parse(raw) })
    } catch {
      console.error('GA_SERVICE_ACCOUNT_JSON is not valid JSON')
      return null
    }
  }
  return { client, property: `properties/${propertyId}` }
}
