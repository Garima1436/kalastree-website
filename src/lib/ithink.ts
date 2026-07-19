// iThink Logistics API client — https://docs.ithinklogistics.com/
// Auth: access_token + secret_key are sent in the JSON body of every request (not headers).

const CREATE_URL = 'https://my.ithinklogistics.com/api_v3/order/add.json'
const TRACK_URL = 'https://api.ithinklogistics.com/api_v3/order/track.json'

function credentials() {
  const access_token = process.env.ITHINK_ACCESS_TOKEN
  const secret_key = process.env.ITHINK_SECRET_KEY
  if (!access_token || !secret_key) {
    throw new Error('iThink Logistics is not configured (ITHINK_ACCESS_TOKEN / ITHINK_SECRET_KEY missing)')
  }
  return { access_token, secret_key }
}

export interface ShipmentItem {
  product_name: string
  product_quantity: number
  product_price: number
}

export interface CreateShipmentInput {
  orderNumber: string
  orderDate: Date
  totalAmount: number
  customerName: string
  addressLine: string
  city: string
  state: string
  pincode: string
  phone: string
  items: ShipmentItem[]
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
  pickupAddressId: number
  returnAddressId: number
}

export interface CreateShipmentResult {
  waybill: string
  trackingUrl: string
  logisticName: string
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getFullYear()}`
}

export async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  const { access_token, secret_key } = credentials()

  const body = {
    data: {
      shipments: [{
        order: input.orderNumber,
        order_date: formatDate(input.orderDate),
        total_amount: String(input.totalAmount),
        name: input.customerName,
        add: input.addressLine,
        city: input.city,
        state: input.state,
        pin: input.pincode,
        phone: input.phone,
        products: input.items.map(i => ({
          product_name: i.product_name,
          product_quantity: String(i.product_quantity),
          product_price: String(i.product_price),
        })),
        shipment_length: String(input.lengthCm),
        shipment_width: String(input.widthCm),
        shipment_height: String(input.heightCm),
        weight: String(input.weightGrams),
        return_address_id: String(input.returnAddressId),
      }],
      pickup_address_id: String(input.pickupAddressId),
      access_token,
      secret_key,
    },
  }

  const res = await fetch(CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json: any = await res.json().catch(() => null)
  if (!res.ok || !json) {
    throw new Error(`iThink create-shipment request failed (HTTP ${res.status})`)
  }

  // Response is keyed by shipment index — we only ever send one shipment ("1")
  const result = json.data?.['1']
  if (json.status !== 'success' || !result || result.status !== 'Success' || !result.waybill) {
    const reason = result?.remark || result?.status || json.message || 'unknown error'
    throw new Error(`iThink rejected shipment: ${reason}`)
  }

  return {
    waybill: result.waybill,
    trackingUrl: result.tracking_url || `https://ithinklogistics.co.in/postship/tracking/${result.waybill}`,
    logisticName: result.logistic_name || '',
  }
}

export interface TrackedStatus {
  currentStatus: string
  currentStatusCode: string
  logistic: string
}

export async function trackShipment(awb: string): Promise<TrackedStatus | null> {
  const { access_token, secret_key } = credentials()

  const res = await fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { awb_number_list: awb, access_token, secret_key } }),
  })

  const json: any = await res.json().catch(() => null)
  if (!res.ok || !json?.data) return null

  const entry = json.data[awb]
  if (!entry) return null

  return {
    currentStatus: entry.current_status ?? '',
    currentStatusCode: entry.current_status_code ?? '',
    logistic: entry.logistic ?? '',
  }
}
