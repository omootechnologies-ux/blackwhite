import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { TaxComplianceForm } from '@/components/TaxComplianceForm'
import { calculateTaxCompliance } from '@/lib/tax'
import {
  getOrCreateTaxSettings,
  normalizeTaxEntry,
  storedSettingsToCalculationSettings,
  taxEntryToCalculationInput,
} from '@/lib/tax-data'
import { currentMonth, formatDate, formatTZS } from '@/lib/utils'

const statusClasses: Record<string, string> = {
  overdue: 'border-red-200 bg-red-50 text-red-700',
  due_soon: 'border-amber-200 bg-amber-50 text-amber-700',
  upcoming: 'border-blue-200 bg-blue-50 text-blue-700',
  info: 'border-ink-200 bg-ink-50 text-ink-700',
}

export default async function TaxCompliancePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .single()
  if (!business) redirect('/dashboard')

  let settings
  try {
    settings = await getOrCreateTaxSettings(supabase, business.id)
  } catch (error: any) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">TRA Compliance</h1>
            <p className="mt-1 text-sm text-ink-400">Daily and monthly tax records for {business.name}</p>
          </div>
        </div>
        <div className="card border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-800">Tax tables are not installed yet</h2>
          <p className="mt-2 text-sm text-amber-700">
            Run the latest <span className="font-mono">supabase/schema.sql</span> in Supabase, then reload this page.
          </p>
          <p className="mt-2 text-xs text-amber-700">{error.message}</p>
        </div>
      </div>
    )
  }

  const month = currentMonth()
  const { start, end } = monthBounds(month)
  const { data: taxEntries } = await supabase
    .from('tax_entries')
    .select('*')
    .eq('business_id', business.id)
    .gte('entry_date', start)
    .lte('entry_date', end)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  const entries = (taxEntries ?? []).map(normalizeTaxEntry)
  const summary = calculateTaxCompliance(
    entries.map(taxEntryToCalculationInput),
    storedSettingsToCalculationSettings(settings),
    month
  )

  const cards = [
    { label: 'Taxable sales', value: formatTZS(summary.taxableSales), sub: `Exempt: ${formatTZS(summary.exemptSales)}` },
    { label: 'VAT payable', value: formatTZS(summary.vatPayable), sub: summary.vatCredit > 0 ? `Credit: ${formatTZS(summary.vatCredit)}` : `Output VAT: ${formatTZS(summary.outputVat)}` },
    { label: 'PAYE + SDL', value: formatTZS(summary.payeDue + summary.sdlDue), sub: `PAYE ${formatTZS(summary.payeDue)} · SDL ${formatTZS(summary.sdlDue)}` },
    { label: 'Income tax estimate', value: formatTZS(summary.incomeTaxEstimate), sub: `Profit estimate: ${formatTZS(summary.profitEstimate)}` },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">TRA Compliance</h1>
          <p className="mt-1 text-sm text-ink-400">Sales, expenses, PAYE, SDL, VAT, income tax, and filing reminders</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-ink-200 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">{card.label}</p>
            <p className="font-display text-xl text-ink-900">{card.value}</p>
            <p className="mt-1 text-xs text-ink-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card">
          <h2 className="mb-4 font-semibold text-ink-800">Calculation breakdown</h2>
          <div className="space-y-3 text-sm">
            <BreakdownRow label="VAT output" value={summary.outputVat} detail={`${settings.vat_rate}% on taxable sales when VAT registered`} />
            <BreakdownRow label="Input VAT" value={summary.inputVat} detail="VAT claimed on eligible purchases" />
            <BreakdownRow label="PAYE" value={summary.payeDue} detail="Total employee PAYE entered for the month" />
            <BreakdownRow label="SDL" value={summary.sdlDue} detail={`${settings.sdl_rate}% of payroll when employees are at least ${settings.sdl_employee_threshold}`} />
            <BreakdownRow label="Income tax provision" value={summary.incomeTaxEstimate} detail={`${settings.income_tax_rate}% of estimated taxable profit`} />
            <div className="rounded-lg bg-ink-950 px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Monthly provision</span>
                <span className="font-mono text-lg font-bold">{formatTZS(summary.totalMonthlyProvision)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-ink-800">Compliance reminders</h2>
          <div className="space-y-3">
            {summary.reminders.map((reminder) => (
              <div key={`${reminder.title}-${reminder.dueDate}`} className={`rounded-lg border px-3 py-3 ${statusClasses[reminder.status]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{reminder.title}</p>
                    <p className="mt-1 text-xs opacity-80">{reminder.detail}</p>
                  </div>
                  {reminder.amount !== undefined && (
                    <span className="whitespace-nowrap font-mono text-xs font-semibold">{formatTZS(reminder.amount)}</span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium">Due: {formatDate(reminder.dueDate)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink-800">VAT threshold watch</h2>
            <p className="mt-1 text-sm text-ink-500">
              Annualized taxable sales: {formatTZS(summary.annualizedTaxableSales)} of {formatTZS(settings.vat_registration_threshold)}
            </p>
          </div>
          <span className="font-mono text-lg font-semibold text-ink-800">{summary.vatThresholdProgress.toFixed(1)}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(summary.vatThresholdProgress, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TaxComplianceForm settings={settings} />

        <div className="card h-fit">
          <h2 className="mb-4 font-semibold text-ink-800">Current month entries</h2>
          {!entries.length ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">TRA</div>
              <p className="font-medium text-ink-700">No tax entries yet</p>
              <p className="mt-1 text-sm text-ink-400">Add today sales, expenses, or payroll to start reminders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-ink-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{formatDate(entry.entry_date)}</p>
                      <p className="text-xs uppercase tracking-wide text-ink-400">{entry.period_type}</p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-brand-700">{formatTZS(entry.sales_vat_exclusive + entry.exempt_sales)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-500">
                    <span>Expenses: {formatTZS(entry.deductible_expenses)}</span>
                    <span>Input VAT: {formatTZS(entry.input_vat)}</span>
                    <span>Payroll: {formatTZS(entry.payroll_gross)}</span>
                    <span>PAYE: {formatTZS(entry.paye_withheld)}</span>
                  </div>
                  {entry.notes && <p className="mt-2 text-xs text-ink-500">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BreakdownRow({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 pb-3 last:border-b-0 last:pb-0">
      <div>
        <p className="font-medium text-ink-700">{label}</p>
        <p className="mt-0.5 text-xs text-ink-400">{detail}</p>
      </div>
      <span className="whitespace-nowrap font-mono font-semibold text-ink-800">{formatTZS(value)}</span>
    </div>
  )
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const start = `${month}-01`
  const lastDay = new Date(year, monthNumber, 0).getDate()
  const end = `${month}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}
