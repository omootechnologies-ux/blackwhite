import { Invoice, MongikePaymentRequest, MongikePaymentResponse, MongikeErrorResponse } from '@/types'

const DEFAULT_MONGIKE_BASE_URL = 'https://mongike.com/api/v1'

function toInternationalPhoneWithoutPlus(phone: string): string {
  const normalized = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '')

  if (!normalized) {
    throw new Error('buyerPhone is required in international format (e.g. 2557XXXXXXXX)')
  }

  if (normalized.startsWith('+')) {
    throw new Error('buyerPhone must be in international format without + (e.g. 2557XXXXXXXX)')
  }

  if (!/^\d{9,15}$/.test(normalized)) {
    throw new Error('buyerPhone must contain only digits and be 9-15 characters long')
  }

  return normalized
}

export async function initiateMongikeMobileMoneyPayment({
  orderId,
  amount,
  buyerPhone,
  buyerName,
  buyerEmail,
  feePayer = 'MERCHANT',
  metadata,
}: MongikePaymentRequest): Promise<MongikePaymentResponse> {
  const apiKey = process.env.MONGIKE_API_KEY
  if (!apiKey) {
    throw new Error('MONGIKE_API_KEY is missing. Add it to your environment variables.')
  }

  const baseUrl = process.env.MONGIKE_BASE_URL || DEFAULT_MONGIKE_BASE_URL
  const normalizedPhone = toInternationalPhoneWithoutPlus(buyerPhone)

  const response = await fetch(`${baseUrl}/payments/mobile-money/tanzania`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: orderId,
      amount,
      buyer_phone: normalizedPhone,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      fee_payer: feePayer,
      metadata,
    }),
  })

  const raw = await response.text()
  let payload: MongikePaymentResponse | MongikeErrorResponse

  try {
    payload = JSON.parse(raw) as MongikePaymentResponse | MongikeErrorResponse
  } catch {
    throw new Error(`Mongike returned invalid JSON (status ${response.status}): ${raw.slice(0, 200)}`)
  }

  if (!response.ok) {
    const message = 'message' in payload && payload.message
      ? payload.message
      : `Mongike payment request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload as MongikePaymentResponse
}

// WhatsApp share URL builder
export function buildWhatsAppLink(invoice: Invoice, pdfUrl: string): string {
  const message = encodeURIComponent(
    `Habari ${invoice.client_name},\n\n` +
      `Hii ni invoice ${invoice.number} kutoka kwa mimi.\n` +
      `Kiasi: TZS ${invoice.total.toLocaleString()}\n` +
      `${invoice.due_date ? `Tarehe ya mwisho: ${invoice.due_date}\n` : ''}` +
      `\nBonyeza hapa kuona na kulipa:\n${pdfUrl}\n` +
      `${invoice.payment_link ? `\nLipa moja kwa moja:\n${invoice.payment_link}` : ''}`
  )

  const phone = invoice.client_phone?.replace(/[^0-9]/g, '').replace(/^0/, '255')
  return phone
    ? `https://wa.me/${phone}?text=${message}`
    : `https://wa.me/?text=${message}`
}

export function parseMongikeWebhookStatus(body: Record<string, any>): {
  isPaid: boolean
  orderId?: string
  gatewayRef?: string
} {
  // TODO: Confirm official Mongike webhook schema + signature fields once docs are available.
  const status = String(body?.status || body?.payment_status || '').toLowerCase()
  const orderId = body?.order_id || body?.orderId || body?.reference
  const gatewayRef = body?.gateway_ref || body?.gatewayRef

  return {
    isPaid: status === 'success' || status === 'paid' || status === 'completed',
    orderId,
    gatewayRef,
  }
}
