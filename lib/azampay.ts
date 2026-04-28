import { Invoice } from '@/types'

const AZAM_BASE = process.env.AZAM_BASE_URL || 'https://checkout.azampay.co.tz'

// ============================================================
// Azam Pay — Tanzania Payment Gateway
// Docs: https://developerdocs.azampay.co.tz
// ============================================================

async function getToken(): Promise<string> {
  const res = await fetch(`${AZAM_BASE}/AppRegistration/GenerateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName: process.env.AZAM_APP_NAME,
      clientId: process.env.AZAM_CLIENT_ID,
      clientSecret: process.env.AZAM_CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`Azam Pay auth failed: ${res.status}`)
  }

  const data = await res.json()
  return data.data.accessToken
}

export async function createPaymentLink(invoice: Invoice): Promise<string | null> {
  try {
    const token = await getToken()

    const res = await fetch(`${AZAM_BASE}/api/v1/Partner/PostCheckout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: process.env.AZAM_MERCHANT_ID,
        appName: process.env.AZAM_APP_NAME,
        clientId: invoice.id,
        currency: 'TZS',
        externalId: invoice.number,
        amount: Math.round(invoice.total).toString(),
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
        cart: {
          items: invoice.items.map((item) => ({
            name: item.description,
            quantity: item.qty,
            price: item.unit_price,
            totalPrice: item.amount,
          })),
        },
        vendor: invoice.client_name,
      }),
    })

    if (!res.ok) {
      console.error('Azam Pay checkout failed:', await res.text())
      return null
    }

    const data = await res.json()
    return data.paymentLink || null
  } catch (err) {
    console.error('Azam Pay error:', err)
    return null
  }
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
