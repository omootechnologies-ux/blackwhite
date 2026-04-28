import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { initiateMongikeMobileMoneyPayment, buildWhatsAppLink } from '@/lib/mongike'

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
  const orderId = body.orderId || invoice.number
  const amount = Number(body.amount ?? invoice.total)
  const buyerPhone = body.customerPhone || invoice.client_phone
  const buyerName = body.customerName || invoice.client_name
  const buyerEmail = body.customerEmail || invoice.client_email

  if (!buyerPhone) {
    return NextResponse.json(
      { error: 'Mteja hana namba ya simu kwa malipo ya mobile money.' },
      { status: 400 }
    )
  }

  // Generate PDF first (if not exists)
  let pdfUrl = invoice.pdf_url
  if (!pdfUrl) {
    await fetch(
      `${req.nextUrl.origin}/api/invoices/${invoice.id}/pdf`,
      { headers: { cookie: req.headers.get('cookie') || '' } }
    )
    const updated = await supabase
      .from('invoices').select('pdf_url').eq('id', invoice.id).single()
    pdfUrl = updated.data?.pdf_url
  }

  let paymentLink: string | null = null
  let paymentData: Record<string, any> | null = null

  try {
    const mongikeResponse = await initiateMongikeMobileMoneyPayment({
      orderId,
      amount,
      buyerPhone,
      buyerName,
      buyerEmail,
      feePayer: 'MERCHANT',
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
        business_id: business.id,
      },
    })

    paymentData = mongikeResponse.data
    paymentLink = paymentData?.gateway_ref || null
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment request failed' }, { status: 502 })
  }


    const mappedPayment = {
      provider: 'mongike',
      gateway_ref: paymentData?.gateway_ref || null,
      provider_payment_id: paymentData?.id || null,
      order_id: paymentData?.order_id || orderId,
      status: paymentData?.status || null,
      expires_at: paymentData?.expires_at || null,
    }

  // Build WhatsApp URL
  const whatsappUrl = buildWhatsAppLink(
    { ...invoice, payment_link: paymentLink || undefined },
    pdfUrl || ''
  )

  // Update invoice status
  await supabase.from('invoices').update({
    status: 'sent',
    payment_link: paymentLink,
    pdf_url: pdfUrl,
  }).eq('id', invoice.id)

  return NextResponse.json({ whatsappUrl, paymentLink, pdfUrl, payment: paymentData, mappedPayment })
}
