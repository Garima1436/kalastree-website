// Shared shipping-info validation for all three order-creation routes
// (cod, razorpay/create-order, stripe/create-session). Client-side "required"
// only prompts the browser's UI — a request can still arrive with any of
// these blank, so the server must enforce it too.
export function missingShippingFields(info: {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}): string | null {
  const required: [string, string | undefined][] = [
    ['name', info.name],
    ['email', info.email],
    ['phone', info.phone],
    ['address', info.address],
    ['city', info.city],
    ['state', info.state],
    ['pincode', info.pincode],
  ]
  const missing = required.filter(([, v]) => !v?.trim()).map(([k]) => k)
  if (missing.length === 0) return null
  return `Missing required shipping info: ${missing.join(', ')}`
}
