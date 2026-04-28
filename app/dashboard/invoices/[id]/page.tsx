import { createServerClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatTZS, formatDate } from '@/lib/utils'
import { InvoiceActions } from '@/components/InvoiceActions'

const statusColors: Record<string, string> = {
  draft: 'badge-draft', sent: 'badge-sent', paid: 'badge-paid', overdue: 'badge-overdue',
}
const statusLabels: Record<string, string> = {
  draft: 'Rasimu', sent: 'Imetumwa', paid: 'Imelipwa', overdue: 'Imechelewa',
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/dashboard')

  const { data: invoice } = await supabase
    .from('invoices').select('*').eq('id', params.id).eq('business_id', business.id).single()
  if (!invoice) notFound()

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/invoices" className="text-sm text-ink-400 hover:text-ink-600">← Invoices</Link>
            <span className="text-ink-200">/</span>
            <span className="text-sm font-mono text-ink-600">{invoice.number}</span>
          </div>
          <h1 className="page-title">{invoice.client_name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${statusColors[invoice.status]}`}>{statusLabels[invoice.status]}</span>
          <InvoiceActions invoice={invoice} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Jumla Kuu</p>
          <p className="font-display text-2xl text-ink-900">{formatTZS(invoice.total)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Tarehe</p>
          <p className="font-semibold text-ink-700">{formatDate(invoice.created_at)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Tarehe ya Mwisho</p>
          <p className="font-semibold text-ink-700">{invoice.due_date ? formatDate(invoice.due_date) : 'Haraka'}</p>
        </div>
      </div>

      {/* Client info */}
      <div className="card mb-4">
        <h2 className="font-semibold text-ink-700 mb-4 text-sm uppercase tracking-wide">Maelezo ya Mteja</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-ink-400 text-xs mb-0.5">Jina</p>
            <p className="font-medium text-ink-800">{invoice.client_name}</p>
          </div>
          {invoice.client_phone && (
            <div>
              <p className="text-ink-400 text-xs mb-0.5">Simu</p>
              <p className="font-medium text-ink-800">{invoice.client_phone}</p>
            </div>
          )}
          {invoice.client_email && (
            <div>
              <p className="text-ink-400 text-xs mb-0.5">Barua Pepe</p>
              <p className="font-medium text-ink-800">{invoice.client_email}</p>
            </div>
          )}
          {invoice.client_tin && (
            <div>
              <p className="text-ink-400 text-xs mb-0.5">TIN</p>
              <p className="font-medium text-ink-800">{invoice.client_tin}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card mb-4">
        <h2 className="font-semibold text-ink-700 mb-4 text-sm uppercase tracking-wide">Bidhaa / Huduma</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Maelezo</th>
              <th>Idadi</th>
              <th>Bei/Kipande</th>
              <th className="text-right">Jumla</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, i: number) => (
              <tr key={i}>
                <td className="font-medium">{item.description}</td>
                <td>{item.qty}</td>
                <td className="font-mono text-sm">{formatTZS(item.unit_price)}</td>
                <td className="font-mono text-sm font-semibold text-right">{formatTZS(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4 pt-4 border-t border-ink-100">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Jumla Ndogo</span>
              <span className="font-mono">{formatTZS(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>VAT ({invoice.vat_rate}%)</span>
              <span className="font-mono">{formatTZS(invoice.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-ink-200">
              <span>JUMLA KUU</span>
              <span className="font-mono text-brand-700">{formatTZS(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment link */}
      {invoice.payment_link && (
        <div className="card bg-brand-50 border-brand-200 mb-4">
          <h2 className="font-semibold text-brand-700 mb-2 text-sm">Kiungo cha Malipo (M-Pesa)</h2>
          <p className="text-sm font-mono text-brand-600 break-all">{invoice.payment_link}</p>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="card">
          <h2 className="font-semibold text-ink-700 mb-2 text-sm uppercase tracking-wide">Maelezo</h2>
          <p className="text-sm text-ink-600">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
