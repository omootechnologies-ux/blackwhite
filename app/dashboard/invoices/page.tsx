import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTZS, formatDate } from '@/lib/utils'
import { getServerT } from '@/lib/i18n/server'

const statusColors: Record<string, string> = {
  draft: 'badge-draft', sent: 'badge-sent', paid: 'badge-paid', overdue: 'badge-overdue',
}
export default async function InvoicesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { t } = getServerT()
  const statusLabels: Record<string, string> = {
    draft: t('common.status.draft'),
    sent: t('common.status.sent'),
    paid: t('common.status.paid'),
    overdue: t('common.status.overdue'),
  }

  const { data: business } = await supabase
    .from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) redirect('/dashboard')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const totals = {
    paid: (invoices ?? []).filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    pending: (invoices ?? []).filter(i => i.status === 'sent').reduce((s, i) => s + i.total, 0),
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('invoices.title')}</h1>
          <p className="text-sm text-ink-400 mt-1">{t('invoices.subtitle')}</p>
        </div>
        <Link href="/dashboard/invoices/new" className="btn-primary">+ {t('invoices.new')}</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">{t('common.paid')}</p>
          <p className="font-display text-xl text-brand-700">{formatTZS(totals.paid)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">{t('common.pending')}</p>
          <p className="font-display text-xl text-amber-700">{formatTZS(totals.pending)}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {!invoices?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p className="font-medium text-ink-700 mb-1">{t('invoices.empty')}</p>
            <p className="text-sm text-ink-400 mb-5">{t('invoices.emptyHint')}</p>
            <Link href="/dashboard/invoices/new" className="btn-primary">+ {t('invoices.new')}</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('invoices.number')}</th>
                <th>{t('common.client')}</th>
                <th>{t('common.total')}</th>
                <th>{t('common.dueDate')}</th>
                <th>{t('common.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><span className="font-mono text-xs font-semibold text-ink-600">{inv.number}</span></td>
                  <td>
                    <div className="font-medium text-ink-800">{inv.client_name}</div>
                    {inv.client_phone && <div className="text-xs text-ink-400">{inv.client_phone}</div>}
                  </td>
                  <td className="font-mono text-sm font-medium">{formatTZS(inv.total)}</td>
                  <td className="text-ink-500 text-xs">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                  <td><span className={`badge ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</span></td>
                  <td>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                      {t('common.open')} →
                    </Link>
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
