'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TaxSettings } from '@/types'
import { formatTZS } from '@/lib/utils'

type EntryForm = {
  period_type: 'daily' | 'monthly'
  entry_date: string
  entry_month: string
  sales_vat_exclusive: string
  exempt_sales: string
  deductible_expenses: string
  input_vat: string
  payroll_gross: string
  paye_withheld: string
  employee_count: string
  notes: string
}

type SettingsForm = {
  vat_registered: boolean
  vat_rate: string
  vat_registration_threshold: string
  income_tax_rate: string
  sdl_rate: string
  sdl_employee_threshold: string
  nssf_employee_rate: string
  nssf_employer_rate: string
  paye_due_day: string
  vat_due_day: string
}

interface Props {
  settings: TaxSettings
}

export function TaxComplianceForm({ settings }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = today.slice(0, 7)
  const [entry, setEntry] = useState<EntryForm>({
    period_type: 'daily',
    entry_date: today,
    entry_month: currentMonth,
    sales_vat_exclusive: '',
    exempt_sales: '',
    deductible_expenses: '',
    input_vat: '',
    payroll_gross: '',
    paye_withheld: '',
    employee_count: '',
    notes: '',
  })
  const [rates, setRates] = useState<SettingsForm>({
    vat_registered: settings.vat_registered,
    vat_rate: String(settings.vat_rate),
    vat_registration_threshold: String(settings.vat_registration_threshold),
    income_tax_rate: String(settings.income_tax_rate),
    sdl_rate: String(settings.sdl_rate),
    sdl_employee_threshold: String(settings.sdl_employee_threshold),
    nssf_employee_rate: String(settings.nssf_employee_rate),
    nssf_employer_rate: String(settings.nssf_employer_rate),
    paye_due_day: String(settings.paye_due_day),
    vat_due_day: String(settings.vat_due_day),
  })
  const [entrySaving, setEntrySaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateEntry(field: keyof EntryForm, value: string) {
    setEntry((current) => ({ ...current, [field]: value }))
  }

  function updateRate(field: keyof SettingsForm, value: string | boolean) {
    setRates((current) => ({ ...current, [field]: value }))
  }

  async function handleEntrySubmit(event: React.FormEvent) {
    event.preventDefault()
    setEntrySaving(true)
    setError(null)
    setMessage(null)

    const res = await fetch('/api/tax/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        entry_date: entry.period_type === 'monthly' ? entry.entry_month : entry.entry_date,
        sales_vat_exclusive: numberValue(entry.sales_vat_exclusive),
        exempt_sales: numberValue(entry.exempt_sales),
        deductible_expenses: numberValue(entry.deductible_expenses),
        input_vat: numberValue(entry.input_vat),
        payroll_gross: numberValue(entry.payroll_gross),
        paye_withheld: numberValue(entry.paye_withheld),
        employee_count: numberValue(entry.employee_count),
      }),
    })

    setEntrySaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Could not save the tax entry.')
      return
    }

    setEntry((current) => ({
      ...current,
      sales_vat_exclusive: '',
      exempt_sales: '',
      deductible_expenses: '',
      input_vat: '',
      payroll_gross: '',
      paye_withheld: '',
      employee_count: '',
      notes: '',
    }))
    setMessage('Tax entry saved.')
    router.refresh()
  }

  async function handleSettingsSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSettingsSaving(true)
    setError(null)
    setMessage(null)

    const res = await fetch('/api/tax/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vat_registered: rates.vat_registered,
        vat_rate: numberValue(rates.vat_rate),
        vat_registration_threshold: numberValue(rates.vat_registration_threshold),
        income_tax_rate: numberValue(rates.income_tax_rate),
        sdl_rate: numberValue(rates.sdl_rate),
        sdl_employee_threshold: numberValue(rates.sdl_employee_threshold),
        nssf_employee_rate: numberValue(rates.nssf_employee_rate),
        nssf_employer_rate: numberValue(rates.nssf_employer_rate),
        paye_due_day: numberValue(rates.paye_due_day),
        vat_due_day: numberValue(rates.vat_due_day),
        income_tax_installment_months: settings.income_tax_installment_months,
      }),
    })

    setSettingsSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Could not save tax settings.')
      return
    }

    setMessage('Tax settings saved.')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {(error || message) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-brand-200 bg-brand-50 text-brand-700'}`}>
          {error || message}
        </div>
      )}

      <form onSubmit={handleEntrySubmit} className="card">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink-800">Sales, expenses, and payroll entry</h2>
            <p className="mt-1 text-sm text-ink-500">Use daily entries for cash/EFD records or one monthly entry after reconciliation.</p>
          </div>
          <div className="inline-grid grid-cols-2 rounded-lg border border-ink-200 bg-ink-50 p-1 text-sm">
            {(['daily', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateEntry('period_type', mode)}
                className={`rounded-md px-3 py-1.5 font-medium capitalize ${entry.period_type === mode ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">{entry.period_type === 'daily' ? 'Entry date' : 'Entry month'}</label>
            {entry.period_type === 'daily' ? (
              <input className="input" type="date" value={entry.entry_date} onChange={(event) => updateEntry('entry_date', event.target.value)} />
            ) : (
              <input className="input" type="month" value={entry.entry_month} onChange={(event) => updateEntry('entry_month', event.target.value)} />
            )}
          </div>
          <MoneyInput label="Taxable sales, VAT exclusive" value={entry.sales_vat_exclusive} onChange={(value) => updateEntry('sales_vat_exclusive', value)} />
          <MoneyInput label="Exempt or zero-rated sales" value={entry.exempt_sales} onChange={(value) => updateEntry('exempt_sales', value)} />
          <MoneyInput label="Deductible expenses" value={entry.deductible_expenses} onChange={(value) => updateEntry('deductible_expenses', value)} />
          <MoneyInput label="Input VAT on purchases" value={entry.input_vat} onChange={(value) => updateEntry('input_vat', value)} />
          <MoneyInput label="Payroll gross for PAYE/SDL" value={entry.payroll_gross} onChange={(value) => updateEntry('payroll_gross', value)} />
          <MoneyInput label="PAYE withheld" value={entry.paye_withheld} onChange={(value) => updateEntry('paye_withheld', value)} />
          <div>
            <label className="input-label">Employee count</label>
            <input className="input" type="number" min="0" inputMode="numeric" value={entry.employee_count} onChange={(event) => updateEntry('employee_count', event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="input-label">Notes</label>
            <textarea className="input min-h-20 resize-none" value={entry.notes} onChange={(event) => updateEntry('notes', event.target.value)} placeholder="EFD Z-report, payroll batch, purchase file, or reminder context" />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={entrySaving} className="btn-primary">
            {entrySaving ? 'Saving...' : 'Save tax entry'}
          </button>
        </div>
      </form>

      <form onSubmit={handleSettingsSubmit} className="card">
        <div className="mb-5">
          <h2 className="font-semibold text-ink-800">Configurable Tanzanian tax rates</h2>
          <p className="mt-1 text-sm text-ink-500">{settings.source_note}</p>
        </div>

        <label className="mb-4 flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-3 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            checked={rates.vat_registered}
            onChange={(event) => updateRate('vat_registered', event.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600"
          />
          Business is VAT registered
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <RateInput label="VAT rate" value={rates.vat_rate} onChange={(value) => updateRate('vat_rate', value)} />
          <MoneyInput label="VAT registration threshold" value={rates.vat_registration_threshold} onChange={(value) => updateRate('vat_registration_threshold', value)} />
          <RateInput label="Income tax rate" value={rates.income_tax_rate} onChange={(value) => updateRate('income_tax_rate', value)} />
          <RateInput label="SDL rate" value={rates.sdl_rate} onChange={(value) => updateRate('sdl_rate', value)} />
          <NumberInput label="SDL employee threshold" value={rates.sdl_employee_threshold} onChange={(value) => updateRate('sdl_employee_threshold', value)} />
          <RateInput label="NSSF employee rate" value={rates.nssf_employee_rate} onChange={(value) => updateRate('nssf_employee_rate', value)} />
          <RateInput label="NSSF employer rate" value={rates.nssf_employer_rate} onChange={(value) => updateRate('nssf_employer_rate', value)} />
          <NumberInput label="PAYE/SDL due day" value={rates.paye_due_day} onChange={(value) => updateRate('paye_due_day', value)} />
          <NumberInput label="VAT due day" value={rates.vat_due_day} onChange={(value) => updateRate('vat_due_day', value)} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">Current VAT threshold: {formatTZS(numberValue(rates.vat_registration_threshold))}</p>
          <button type="submit" disabled={settingsSaving} className="btn-secondary">
            {settingsSaving ? 'Saving...' : 'Save rates'}
          </button>
        </div>
      </form>
    </div>
  )
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input className="input font-mono" type="number" min="0" inputMode="decimal" placeholder="0" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function RateInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="input-label">{label} (%)</label>
      <input className="input font-mono" type="number" min="0" max="100" step="0.01" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input className="input font-mono" type="number" min="0" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function numberValue(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
