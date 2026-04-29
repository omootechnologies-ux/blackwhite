import type { SupabaseClient } from '@supabase/supabase-js'
import type { Business, Invoice, Payslip } from '@/types'
import {
  htmlToPDF,
  renderInvoiceFallbackPDF,
  renderInvoiceHTML,
  renderPayslipFallbackPDF,
  renderPayslipHTML,
} from '@/lib/pdf'
import { createAdminClient } from '@/lib/supabase/admin'

export const DOCUMENTS_BUCKET = 'documents'
export const BUSINESS_LOGOS_BUCKET = 'business-logos'
export const LEGACY_LOGOS_BUCKET = 'logos'

type PdfResult = {
  pdfBuffer: Buffer
  pdfUrl: string | null
  path: string
}

export async function generateAndStoreInvoicePdf(
  supabase: SupabaseClient,
  business: Business,
  invoice: Invoice
): Promise<PdfResult> {
  const html = await renderInvoiceHTML(invoice, business)
  const pdfBuffer = await renderPdfWithFallback(
    () => htmlToPDF(html),
    () => renderInvoiceFallbackPDF(invoice, business),
    'invoice'
  )
  const path = `invoices/${business.id}/${invoice.id}.pdf`
  const pdfUrl = await uploadPdf(path, pdfBuffer)

  if (pdfUrl) {
    await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoice.id)
  }

  return { pdfBuffer, pdfUrl, path }
}

export async function generateAndStorePayslipPdf(
  supabase: SupabaseClient,
  business: Business,
  payslip: Payslip
): Promise<PdfResult> {
  const html = await renderPayslipHTML(payslip, business)
  const pdfBuffer = await renderPdfWithFallback(
    () => htmlToPDF(html),
    () => renderPayslipFallbackPDF(payslip, business),
    'payslip'
  )
  const path = `payslips/${business.id}/${payslip.id}.pdf`
  const pdfUrl = await uploadPdf(path, pdfBuffer)

  if (pdfUrl) {
    await supabase.from('payslips').update({ pdf_url: pdfUrl }).eq('id', payslip.id)
  }

  return { pdfBuffer, pdfUrl, path }
}

async function renderPdfWithFallback(
  renderPrimary: () => Promise<Buffer>,
  renderFallback: () => Buffer,
  documentType: string
) {
  try {
    return await renderPrimary()
  } catch (error) {
    console.warn(`${documentType} PDF browser render failed; using text PDF fallback:`, error)
    return renderFallback()
  }
}

async function uploadPdf(path: string, pdfBuffer: Buffer) {
  try {
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
  } catch (error) {
    console.warn('PDF storage upload skipped:', error)
    return null
  }
}
