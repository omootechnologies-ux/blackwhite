export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { buildWhatsAppLink } from '@/lib/mongike'
import { generateAndStoreInvoicePdf } from '@/lib/documents'
import { initiateUsagePayment } from '@/lib/payments'
import { getSiteUrl } from '@/lib/site-url'

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
  const buyerPhone = body.payerPhone || business.phone
  const buyerName = body.payerName || business.name
  const buyerEmail = body.payerEmail || business.email || user.email
  const downloadUrl = new URL(`/api/invoices/${invoice.id}/pdf`, getSiteUrl(req.nextUrl.origin)).toString()

  // Generate PDF first (if not exists)
  let pdfUrl = invoice.pdf_url
  if (!pdfUrl) {
    const generated = await generateAndStoreInvoicePdf(supabase, business, invoice)
    pdfUrl = generated.pdfUrl
  }

  let paymentData: Record<string, any> | null = null
  let paymentError: string | null = null

  try {
    paymentData = await initiateUsagePayment({
      supabase,
      user,
      business,
      documentType: 'invoice',
      documentId: invoice.id,
      requestType: 'whatsapp_share',
      buyerPhone,
      buyerName,
      buyerEmail,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
      },
    })
  } catch (error: any) {
    paymentError = error.message || 'Payment request failed'
    console.warn('WhatsApp share payment request skipped:', paymentError)
  }

  // Build WhatsApp URL
  const whatsappUrl = buildWhatsAppLink(invoice, pdfUrl || downloadUrl)

  // Update invoice status
  await supabase.from('invoices').update({
    status: 'sent',
    pdf_url: pdfUrl,
  }).eq('id', invoice.id)

  return NextResponse.json({ whatsappUrl, pdfUrl, downloadUrl, payment: paymentData, paymentError })
}
