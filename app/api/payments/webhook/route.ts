import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parseMongikeWebhookStatus } from '@/lib/mongike'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Mongike webhook:', JSON.stringify(body))

    const { isPaid, orderId, gatewayRef } = parseMongikeWebhookStatus(body)

    if (orderId) {
      const admin = createAdminClient()
      const status = isPaid
        ? 'paid'
        : String(body?.status || body?.payment_status || 'updated').toLowerCase()

      const update: Record<string, string> = { status }
      if (gatewayRef) update.gateway_ref = gatewayRef

      const { error } = await admin
        .from('usage_payments')
        .update(update)
        .eq('order_id', orderId)

      if (error) {
        console.warn('Usage payment webhook update skipped:', error.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
