import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Azam Pay webhook:', JSON.stringify(body))

    if (body.transactionStatus === 'success' || body.status === 'success') {
      const admin = createAdminClient()
      const invoiceNumber = body.externalId || body.reference

      if (invoiceNumber) {
        await admin
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('number', invoiceNumber)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
