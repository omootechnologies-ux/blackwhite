import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentLink, buildWhatsAppLink } from '@/lib/azampay'

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

  // Generate PDF first (if not exists)
  let pdfUrl = invoice.pdf_url
  if (!pdfUrl) {
    const pdfRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/invoices/${invoice.id}/pdf`,
      { headers: { cookie: req.headers.get('cookie') || '' } }
    )
    const updated = await supabase
      .from('invoices').select('pdf_url').eq('id', invoice.id).single()
    pdfUrl = updated.data?.pdf_url
  }

  // Create Azam Pay payment link
  const paymentLink = await createPaymentLink(invoice)

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

  return NextResponse.json({ whatsappUrl, paymentLink, pdfUrl })
}
