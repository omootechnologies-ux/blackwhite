export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { generateAndStoreInvoicePdf } from '@/lib/documents'
import { EmailConfigurationError, assertEmailConfigured, escapeEmailHtml, sendDocumentEmail } from '@/lib/email'
import { initiateUsagePayment } from '@/lib/payments'
import { formatTZS } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const { data: invoice } = await supabase
    .from('invoices').select('*').eq('id', params.id).eq('business_id', business.id).single()
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const to = String(body.email || invoice.client_email || '').trim()

  if (!to) {
    return NextResponse.json({ error: 'Enter an email address before sending.' }, { status: 400 })
  }

  try {
    assertEmailConfigured()

    const { pdfUrl } = await generateAndStoreInvoicePdf(supabase, business, invoice)
    const payment = await initiateUsagePayment({
      supabase,
      user,
      business,
      documentType: 'invoice',
      documentId: invoice.id,
      requestType: 'email_share',
      buyerPhone: body.payerPhone || business.phone,
      buyerName: business.name,
      buyerEmail: business.email || user.email,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
        recipient_email: to,
      },
    })

    await sendDocumentEmail({
      to,
      documentType: 'invoice',
      documentId: invoice.id,
      pdfUrl,
      filename: `${invoice.number}.pdf`,
      replyTo: business.email,
      subject: `Invoice ${invoice.number} from ${business.name}`,
      text:
        `Hello ${invoice.client_name},\n\n` +
        `${business.name} shared invoice ${invoice.number} for ${formatTZS(invoice.total)}.\n` +
        `Open the PDF here:\n${pdfUrl}\n`,
      html:
        `<p>Hello ${escapeEmailHtml(invoice.client_name)},</p>` +
        `<p>${escapeEmailHtml(business.name)} shared invoice <strong>${escapeEmailHtml(invoice.number)}</strong> for <strong>${escapeEmailHtml(formatTZS(invoice.total))}</strong>.</p>` +
        `<p><a href="${escapeEmailHtml(pdfUrl)}">Open the PDF</a></p>`,
    })

    await supabase.from('invoices').update({ status: 'sent', pdf_url: pdfUrl }).eq('id', invoice.id)

    return NextResponse.json({ ok: true, pdfUrl, payment })
  } catch (err: any) {
    console.error('Invoice email error:', err)
    if (err instanceof EmailConfigurationError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }

    return NextResponse.json({ error: err.message || 'Email failed' }, { status: 502 })
  }
}
