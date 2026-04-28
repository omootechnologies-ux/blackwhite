import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parseMongikeWebhookStatus } from '@/lib/mongike'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Mongike webhook:', JSON.stringify(body))

    const { isPaid, orderId } = parseMongikeWebhookStatus(body)

    if (isPaid && orderId) {
      const admin = createAdminClient()

      await admin
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('number', orderId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
