export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateAndStoreInvoicePdf } from '@/lib/documents'
import { initiateUsagePayment } from '@/lib/payments'
import { getSiteUrl } from '@/lib/site-url'

async function getInvoiceContext(params: { id: string }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null }

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return { supabase, user, business: null }

  const { data: invoice } = await supabase
    .from('invoices').select('*').eq('id', params.id).eq('business_id', business.id).single()

  return { supabase, user, business, invoice }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, business, invoice } = await getInvoiceContext(params)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { pdfBuffer } = await generateAndStoreInvoicePdf(supabase, business, invoice)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${req.nextUrl.searchParams.get('view') === '1' ? 'inline' : 'attachment'}; filename="${safePdfName(invoice.number)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, business, invoice } = await getInvoiceContext(params)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  try {
    const payment = await initiateUsagePayment({
      supabase,
      user,
      business,
      documentType: 'invoice',
      documentId: invoice.id,
      requestType: body.requestType || 'invoice_pdf',
      buyerPhone: body.payerPhone || business.phone,
      buyerName: business.name,
      buyerEmail: business.email || user.email,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
      },
    })

    const { pdfUrl } = await generateAndStoreInvoicePdf(supabase, business, invoice)
    const downloadUrl = new URL(`/api/invoices/${invoice.id}/pdf`, getSiteUrl(req.nextUrl.origin)).toString()

    return NextResponse.json({ pdfUrl, downloadUrl, payment })
  } catch (err: any) {
    console.error('Paid invoice PDF error:', err)
    return NextResponse.json(
      { error: err.message || 'PDF payment request failed' },
      { status: err.message?.includes('phone') ? 400 : 502 }
    )
  }
}

function safePdfName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '') || 'invoice'
}
