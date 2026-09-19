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

// Why getGa() would return null, without revealing any values. For diagnosing a
// deployment where the settings didn't arrive.
export function gaConfigProblem(): 'missing_property_id' | 'missing_key' | 'invalid_key' | null {
  if (!process.env.GA_PROPERTY_ID) return 'missing_property_id'
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON
  if (!raw) return 'missing_key'
  try {
    const k = JSON.parse(raw)
    return k && typeof k.client_email === 'string' && typeof k.private_key === 'string' ? null : 'invalid_key'
  } catch {
    return 'invalid_key'
  }
}
