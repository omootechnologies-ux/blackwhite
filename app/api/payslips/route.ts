export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { calculatePayroll } from '@/lib/tax'
import { htmlToPDF, renderPayslipHTML } from '@/lib/pdf'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const body = await req.json()
  const { basic_salary, allowances = [], other_deductions = [], ...rest } = body

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

  // Generate PDF in background
  try {
    const html = renderPayslipHTML(payslip, business)
    const pdfBuffer = await htmlToPDF(html)
    const admin = createAdminClient()
    const filename = `payslips/${business.id}/${payslip.id}.pdf`
    await admin.storage.from('documents').upload(filename, pdfBuffer, {
      contentType: 'application/pdf', upsert: true,
    })
    const { data: urlData } = admin.storage.from('documents').getPublicUrl(filename)
    await supabase.from('payslips').update({ pdf_url: urlData.publicUrl }).eq('id', payslip.id)
    return NextResponse.json({ ...payslip, pdf_url: urlData.publicUrl })
  } catch (pdfErr) {
    console.error('PDF gen error:', pdfErr)
    return NextResponse.json(payslip)
  }
}
