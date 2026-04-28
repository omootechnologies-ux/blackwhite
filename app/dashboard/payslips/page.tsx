import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTZS, monthLabel } from '@/lib/utils'

export default async function PayslipsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) redirect('/dashboard')

  const { data: payslips } = await supabase
    .from('payslips').select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payslip</h1>
          <p className="text-sm text-ink-400 mt-1">Mshahara na makato ya wafanyakazi</p>
        </div>
        <Link href="/dashboard/payslips/new" className="btn-primary">+ Payslip Mpya</Link>
      </div>
      <div className="card p-0 overflow-hidden">
        {!payslips?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p className="font-medium text-ink-700 mb-1">Hakuna payslip bado</p>
            <p className="text-sm text-ink-400 mb-5">Tengeneza payslip yenye PAYE na NSSF kiotomatiki</p>
            <Link href="/dashboard/payslips/new" className="btn-primary">+ Payslip Mpya</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mfanyakazi</th>
                <th>Cheo</th>
                <th>Mwezi</th>
                <th>Gross</th>
                <th>Net Pay</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((ps) => (
                <tr key={ps.id}>
                  <td>
                    <div className="font-medium text-ink-800">{ps.employee_name}</div>
                    {ps.employee_id && <div className="text-xs text-ink-400">ID: {ps.employee_id}</div>}
                  </td>
                  <td className="text-ink-600 text-sm">{ps.position || '—'}</td>
                  <td className="text-ink-600 text-sm">{monthLabel(ps.month)}</td>
                  <td className="font-mono text-sm">{formatTZS(ps.gross)}</td>
                  <td className="font-mono text-sm font-semibold text-brand-700">{formatTZS(ps.net_pay)}</td>
                  <td>
                    {ps.pdf_url ? (
                      <a href={ps.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 font-medium">PDF ↓</a>
                    ) : <span className="text-xs text-ink-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
