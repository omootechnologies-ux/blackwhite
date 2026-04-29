export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculatePayroll } from '@/lib/tax'
import { generateAndStorePayslipPdf } from '@/lib/documents'
import { initiateUsagePayment } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const body = await req.json()
  const { basic_salary, allowances = [], other_deductions = [], ...rest } = body

  if (!business.phone && !body.payerPhone) {
    return NextResponse.json(
      { error: 'Add a business phone number in settings before creating a paid payslip request.' },
      { status: 400 }
    )
  }

  const payroll = calculatePayroll(Number(basic_salary), allowances, other_deductions)

  const payslipData = {
    business_id: business.id,
    basic_salary: payroll.basic_salary,
    allowances,
    gross: payroll.gross,
    paye: payroll.paye,
    nssf_employee: payroll.nssf_employee,
    nssf_employer: payroll.nssf_employer,
    other_deductions,
    total_deductions: payroll.total_deductions,
    net_pay: payroll.net_pay,
    ...rest,
  }

  const { data: payslip, error } = await supabase
    .from('payslips').insert(payslipData).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const payment = await initiateUsagePayment({
      supabase,
      user,
      business,
      documentType: 'payslip',
      documentId: payslip.id,
      requestType: 'payslip_pdf',
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
    return NextResponse.json({ ...payslip, pdf_url: pdfUrl, payment })
  } catch (err: any) {
    console.error('Payslip payment/PDF error:', err)
    return NextResponse.json(
      { error: err.message || 'Payslip payment or PDF generation failed', payslip_id: payslip.id },
      { status: err.message?.includes('phone') ? 400 : 502 }
    )
  }
}
