import type { SupabaseClient } from '@supabase/supabase-js'
import type { Business, Invoice, Payslip } from '@/types'
import { htmlToPDF, renderInvoiceHTML, renderPayslipHTML } from '@/lib/pdf'
import { createAdminClient } from '@/lib/supabase/admin'

export const DOCUMENTS_BUCKET = 'documents'
export const BUSINESS_LOGOS_BUCKET = 'business-logos'
export const LEGACY_LOGOS_BUCKET = 'logos'

type PdfResult = {
  pdfBuffer: Buffer
  pdfUrl: string
  path: string
}

export async function generateAndStoreInvoicePdf(
  supabase: SupabaseClient,
  business: Business,
  invoice: Invoice
): Promise<PdfResult> {
  const html = await renderInvoiceHTML(invoice, business)
  const pdfBuffer = await htmlToPDF(html)
  const path = `invoices/${business.id}/${invoice.id}.pdf`
  const pdfUrl = await uploadPdf(path, pdfBuffer)

  await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoice.id)

  return { pdfBuffer, pdfUrl, path }
}

export async function generateAndStorePayslipPdf(
  supabase: SupabaseClient,
  business: Business,
  payslip: Payslip
): Promise<PdfResult> {
  const html = await renderPayslipHTML(payslip, business)
  const pdfBuffer = await htmlToPDF(html)
  const path = `payslips/${business.id}/${payslip.id}.pdf`
  const pdfUrl = await uploadPdf(path, pdfBuffer)

  await supabase.from('payslips').update({ pdf_url: pdfUrl }).eq('id', payslip.id)

  return { pdfBuffer, pdfUrl, path }
}

async function uploadPdf(path: string, pdfBuffer: Buffer) {
  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, new Uint8Array(pdfBuffer), {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw error

  const { data } = admin.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
