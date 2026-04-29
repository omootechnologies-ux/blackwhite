export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { generateAndStorePayslipPdf } from '@/lib/documents'
import { initiateUsagePayment } from '@/lib/payments'
import { getSiteUrl } from '@/lib/site-url'
import { NextRequest, NextResponse } from 'next/server'

async function getPayslipContext(params: { id: string }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null }

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return { supabase, user, business: null }

  const { data: payslip } = await supabase
    .from('payslips').select('*').eq('id', params.id).eq('business_id', business.id).single()

  return { supabase, user, business, payslip }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, business, payslip } = await getPayslipContext(params)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })
  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { pdfBuffer } = await generateAndStorePayslipPdf(supabase, business, payslip)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${_req.nextUrl.searchParams.get('view') === '1' ? 'inline' : 'attachment'}; filename="${safePdfName(`payslip-${payslip.employee_name}-${payslip.month}`)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Payslip PDF error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

function safePdfName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '') || 'payslip'
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, business, payslip } = await getPayslipContext(params)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })
  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  try {
    const payment = await initiateUsagePayment({
      supabase,
      user,
      business,
      documentType: 'payslip',
      documentId: payslip.id,
      requestType: body.requestType || 'payslip_pdf',
      buyerPhone: body.payerPhone || business.phone,
      buyerName: business.name,
      buyerEmail: business.email || user.email,
      metadata: {
        payslip_id: payslip.id,
        employee_name: payslip.employee_name,
        month: payslip.month,
      },
    })

    const { pdfUrl } = await generateAndStorePayslipPdf(supabase, business, payslip)
    const downloadUrl = new URL(`/api/payslips/${payslip.id}/pdf`, getSiteUrl(req.nextUrl.origin)).toString()

    return NextResponse.json({ pdfUrl, downloadUrl, payment })
  } catch (err: any) {
    console.error('Paid payslip PDF error:', err)
    return NextResponse.json(
      { error: err.message || 'PDF payment request failed' },
      { status: err.message?.includes('phone') ? 400 : 502 }
    )
  }
}
