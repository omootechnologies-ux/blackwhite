export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { htmlToPDF, renderInvoiceHTML } from '@/lib/pdf'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const { data: invoice } = await supabase
    .from('invoices').select('*').eq('id', params.id).eq('business_id', business.id).single()
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const html = renderInvoiceHTML(invoice, business)
    const pdfBuffer = await htmlToPDF(html)

    // Upload to Supabase Storage
    const admin = createAdminClient()
    const filename = `invoices/${business.id}/${invoice.number}.pdf`
    await admin.storage.from('documents').upload(filename, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    const { data: urlData } = admin.storage.from('documents').getPublicUrl(filename)
    const pdfUrl = urlData.publicUrl

    // Save URL to invoice
    await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoice.id)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
