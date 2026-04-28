import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTZS, formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  // Stats
  const [
    { count: totalInvoices },
    { count: paidInvoices },
    { data: recentInvoices },
    { data: pendingInvoices },
  ] = await Promise.all([
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'paid'),
    supabase.from('invoices').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('*').eq('business_id', business.id).in('status', ['sent', 'overdue']).order('created_at', { ascending: false }),
  ])

  const paidTotal = (await supabase
    .from('invoices')
    .select('total')
    .eq('business_id', business.id)
    .eq('status', 'paid')
  ).data?.reduce((s, i) => s + i.total, 0) ?? 0

  const pendingTotal = (pendingInvoices ?? []).reduce((s, i) => s + i.total, 0)

  const stats = [
    { label: 'Zilizolipwa (Jumla)', value: formatTZS(paidTotal), sub: `${paidInvoices ?? 0} invoice` },
    { label: 'Zinasubiri Malipo', value: formatTZS(pendingTotal), sub: `${(pendingInvoices ?? []).length} invoice` },
    { label: 'Invoice Zote', value: totalInvoices?.toString() ?? '0', sub: 'tangu mwanzo' },
  ]

  const statusColors: Record<string, string> = {
    draft: 'badge-draft',
    sent: 'badge-sent',
    paid: 'badge-paid',
    overdue: 'badge-overdue',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Rasimu',
    sent: 'Imetumwa',
    paid: 'Imelipwa',
    overdue: 'Imechelewa',
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Habari, {business.name} 👋</h1>
          <p className="text-sm text-ink-400 mt-1">Hali ya biashara yako leo</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/payslips/new" className="btn-secondary">
            + Payslip
          </Link>
          <Link href="/dashboard/invoices/new" className="btn-primary">
            + Invoice Mpya
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-ink-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className="font-display text-2xl text-ink-900">{s.value}</p>
            <p className="text-xs text-ink-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink-800">Invoice za Hivi Karibuni</h2>
          <Link href="/dashboard/invoices" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Ona zote →
          </Link>
        </div>

        {!recentInvoices?.length ? (
          <div className="empty-state py-12">
            <div className="empty-state-icon">📄</div>
            <p className="font-medium text-ink-600 mb-1">Hakuna invoice bado</p>
            <p className="text-sm text-ink-400 mb-4">Unda invoice yako ya kwanza leo</p>
            <Link href="/dashboard/invoices/new" className="btn-primary">
              + Invoice Mpya
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Namba</th>
                <th>Mteja</th>
                <th>Jumla</th>
                <th>Tarehe</th>
                <th>Hali</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id} onClick={() => {}} className="cursor-pointer">
                  <td>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono text-xs font-medium text-ink-700 hover:text-brand-600">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="font-medium text-ink-800">{inv.client_name}</td>
                  <td className="font-mono text-sm">{formatTZS(inv.total)}</td>
                  <td className="text-ink-500 text-xs">{formatDate(inv.created_at)}</td>
                  <td>
                    <span className={`badge ${statusColors[inv.status]}`}>
                      {statusLabels[inv.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/payslips" className="card hover:border-brand-300 transition-colors cursor-pointer group">
          <div className="text-2xl mb-3">💰</div>
          <h3 className="font-semibold text-ink-800 group-hover:text-brand-700 transition-colors">Payslip za Wafanyakazi</h3>
          <p className="text-sm text-ink-400 mt-1">Angalia na tengeneza payslip</p>
        </Link>
        <Link href="/dashboard/settings" className="card hover:border-brand-300 transition-colors cursor-pointer group">
          <div className="text-2xl mb-3">🏪</div>
          <h3 className="font-semibold text-ink-800 group-hover:text-brand-700 transition-colors">Maelezo ya Biashara</h3>
          <p className="text-sm text-ink-400 mt-1">Logo, TIN, VRN, anwani</p>
        </Link>
      </div>
    </div>
  )
}
