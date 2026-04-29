import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTZS, monthLabel } from '@/lib/utils'
import { PayslipActions } from '@/components/PayslipActions'
import { getServerT } from '@/lib/i18n/server'

export default async function PayslipsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { t } = getServerT()

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
          <h1 className="page-title">{t('payslips.title')}</h1>
          <p className="text-sm text-ink-400 mt-1">{t('payslips.subtitle')}</p>
        </div>
        <Link href="/dashboard/payslips/new" className="btn-primary">+ {t('payslips.new')}</Link>
      </div>
      <div className="card p-0 overflow-hidden">
        {!payslips?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">PAY</div>
            <p className="font-medium text-ink-700 mb-1">{t('payslips.empty')}</p>
            <p className="text-sm text-ink-400 mb-5">{t('payslips.emptyHint')}</p>
            <Link href="/dashboard/payslips/new" className="btn-primary">+ {t('payslips.new')}</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('payslips.employee')}</th>
                <th>{t('payslips.position')}</th>
                <th>{t('payslips.month')}</th>
                <th>{t('payslips.gross')}</th>
                <th>{t('payslips.netPay')}</th>
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
                  <td className="text-ink-600 text-sm">{ps.position || '-'}</td>
                  <td className="text-ink-600 text-sm">{monthLabel(ps.month)}</td>
                  <td className="font-mono text-sm">{formatTZS(ps.gross)}</td>
                  <td className="font-mono text-sm font-semibold text-brand-700">{formatTZS(ps.net_pay)}</td>
                  <td>
                    <PayslipActions payslip={ps} />
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
