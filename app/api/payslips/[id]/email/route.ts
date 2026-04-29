export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { generateAndStorePayslipPdf } from '@/lib/documents'
import { EmailConfigurationError, assertEmailConfigured, escapeEmailHtml, sendDocumentEmail } from '@/lib/email'
import { initiateUsagePayment } from '@/lib/payments'
import { monthLabel } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const { data: payslip } = await supabase
    .from('payslips').select('*').eq('id', params.id).eq('business_id', business.id).single()
  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const to = String(body.email || '').trim()

  if (!to) {
    return NextResponse.json({ error: 'Enter an email address before sending.' }, { status: 400 })
  }

  try {
    assertEmailConfigured()

    const { pdfUrl } = await generateAndStorePayslipPdf(supabase, business, payslip)
    const payment = await initiateUsagePayment({
      supabase,
      user,
      business,
      documentType: 'payslip',
      documentId: payslip.id,
      requestType: 'email_share',
      buyerPhone: body.payerPhone || business.phone,
      buyerName: business.name,
      buyerEmail: business.email || user.email,
      metadata: {
        payslip_id: payslip.id,
        employee_name: payslip.employee_name,
        recipient_email: to,
      },
    })

    await sendDocumentEmail({
      to,
      documentType: 'payslip',
      documentId: payslip.id,
      pdfUrl,
      filename: `payslip-${payslip.employee_name}-${payslip.month}.pdf`,
      replyTo: business.email,
      subject: `Payslip for ${payslip.employee_name} - ${monthLabel(payslip.month)}`,
      text:
        `Hello ${payslip.employee_name},\n\n` +
        `${business.name} shared your payslip for ${monthLabel(payslip.month)}.\n` +
        `Open the PDF here:\n${pdfUrl}\n`,
      html:
        `<p>Hello ${escapeEmailHtml(payslip.employee_name)},</p>` +
        `<p>${escapeEmailHtml(business.name)} shared your payslip for <strong>${escapeEmailHtml(monthLabel(payslip.month))}</strong>.</p>` +
        `<p><a href="${escapeEmailHtml(pdfUrl)}">Open the PDF</a></p>`,
    })

    return NextResponse.json({ ok: true, pdfUrl, payment })
  } catch (err: any) {
    console.error('Payslip email error:', err)
    if (err instanceof EmailConfigurationError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }

    return NextResponse.json({ error: err.message || 'Email failed' }, { status: 502 })
  }
}
