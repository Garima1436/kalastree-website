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

// NOTE: the exact string iThink expects for a COD shipment ('COD' vs 'cod',
// as seen in their sample payload) hasn't been confirmed against a real COD
// shipment yet — verify with iThink support or a sandbox call before the
// first live COD order ships, same class of issue as the earlier s_type field.
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
  email?: string
  items: ShipmentItem[]
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
  pickupAddressId: number
  returnAddressId: number
  paymentMode: 'Prepaid' | 'COD'
  codAmount: number
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

  // Field set matches iThink's own confirmed working sample payload exactly —
  // several fields marked "optional" in their docs (e.g. s_type) still fail
  // validation if the key is absent, so every documented field is included
  // here with a blank default rather than omitted.
  const body = {
    data: {
      shipments: [{
        waybill: '',
        order: input.orderNumber,
        sub_order: '',
        order_date: formatDate(input.orderDate),
        total_amount: String(input.totalAmount),
        name: input.customerName,
        company_name: '',
        add: input.addressLine,
        add2: '',
        add3: '',
        pin: input.pincode,
        city: input.city,
        state: input.state,
        country: 'India',
        phone: input.phone,
        alt_phone: '',
        email: input.email ?? '',
        // KalaStree checkout only collects one address — billing == shipping.
        // Docs mark the billing_* fields as mandatory even though we never
        // split the two, so they're just mirrored from the shipping address.
        is_billing_same_as_shipping: 'yes',
        billing_name: input.customerName,
        billing_company_name: '',
        billing_add: input.addressLine,
        billing_add2: '',
        billing_add3: '',
        billing_pin: input.pincode,
        billing_city: input.city,
        billing_state: input.state,
        billing_country: 'India',
        billing_phone: input.phone,
        billing_alt_phone: '',
        billing_email: input.email ?? '',
        products: input.items.map(i => ({
          product_name: i.product_name,
          product_sku: '',
          product_quantity: String(i.product_quantity),
          product_price: String(i.product_price),
          product_tax_rate: '0',
          product_hsn_code: '',
          product_discount: '0',
          product_img_url: '',
        })),
        shipment_length: String(input.lengthCm),
        shipment_width: String(input.widthCm),
        shipment_height: String(input.heightCm),
        weight: String(input.weightGrams),
        shipping_charges: '0',
        giftwrap_charges: '0',
        transaction_charges: '0',
        total_discount: '0',
        first_attemp_discount: '0',
        cod_amount: String(input.codAmount),
        payment_mode: input.paymentMode,
        reseller_name: '',
        eway_bill_number: '',
        gst_number: '',
        what3words: '',
        return_address_id: String(input.returnAddressId),
      }],
      pickup_address_id: String(input.pickupAddressId),
      access_token,
      secret_key,
      s_type: '',
      order_type: '',
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
    console.error('iThink create-shipment raw response:', JSON.stringify(json))
    const reason = result?.remark || result?.status || json.message || JSON.stringify(json).slice(0, 300)
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
