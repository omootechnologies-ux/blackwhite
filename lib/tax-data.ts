import type { SupabaseClient } from '@supabase/supabase-js'
import type { TaxEntry, TaxSettings as StoredTaxSettings } from '@/types'
import { DEFAULT_TAX_SETTINGS, type TaxEntryInput, type TaxSettings } from '@/lib/tax'

const TAX_SOURCE_NOTE =
  'Defaults reflect current Tanzania Mainland rates used by TRA/PwC references as of 2026; edit settings if TRA changes rates or your business has a special regime.'

export async function getOrCreateTaxSettings(
  supabase: SupabaseClient,
  businessId: string
): Promise<StoredTaxSettings> {
  const { data: existing, error: readError } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()

  if (readError) throw readError
  if (existing) return normalizeStoredTaxSettings(existing)

  const { data: created, error: createError } = await supabase
    .from('tax_settings')
    .insert({
      business_id: businessId,
      ...taxSettingsToDb(DEFAULT_TAX_SETTINGS),
      source_note: TAX_SOURCE_NOTE,
    })
    .select('*')
    .single()

  if (createError) throw createError
  return normalizeStoredTaxSettings(created)
}

export function normalizeStoredTaxSettings(row: any): StoredTaxSettings {
  return {
    ...row,
    vat_registered: Boolean(row.vat_registered),
    vat_rate: toNumber(row.vat_rate, DEFAULT_TAX_SETTINGS.vat_rate),
    vat_registration_threshold: toNumber(
      row.vat_registration_threshold,
      DEFAULT_TAX_SETTINGS.vat_registration_threshold
    ),
    income_tax_rate: toNumber(row.income_tax_rate, DEFAULT_TAX_SETTINGS.income_tax_rate),
    sdl_rate: toNumber(row.sdl_rate, DEFAULT_TAX_SETTINGS.sdl_rate),
    sdl_employee_threshold: toNumber(row.sdl_employee_threshold, DEFAULT_TAX_SETTINGS.sdl_employee_threshold),
    nssf_employee_rate: toNumber(row.nssf_employee_rate, DEFAULT_TAX_SETTINGS.nssf_employee_rate),
    nssf_employer_rate: toNumber(row.nssf_employer_rate, DEFAULT_TAX_SETTINGS.nssf_employer_rate),
    paye_due_day: toNumber(row.paye_due_day, DEFAULT_TAX_SETTINGS.paye_due_day),
    vat_due_day: toNumber(row.vat_due_day, DEFAULT_TAX_SETTINGS.vat_due_day),
    income_tax_installment_months: Array.isArray(row.income_tax_installment_months)
      ? row.income_tax_installment_months.map((month: unknown) => toNumber(month, 0)).filter(Boolean)
      : DEFAULT_TAX_SETTINGS.income_tax_installment_months,
  }
}

export function storedSettingsToCalculationSettings(settings: StoredTaxSettings): TaxSettings {
  return {
    vat_registered: settings.vat_registered,
    vat_rate: settings.vat_rate,
    vat_registration_threshold: settings.vat_registration_threshold,
    income_tax_rate: settings.income_tax_rate,
    sdl_rate: settings.sdl_rate,
    sdl_employee_threshold: settings.sdl_employee_threshold,
    nssf_employee_rate: settings.nssf_employee_rate,
    nssf_employer_rate: settings.nssf_employer_rate,
    paye_due_day: settings.paye_due_day,
    vat_due_day: settings.vat_due_day,
    income_tax_installment_months: settings.income_tax_installment_months,
    paye_brackets: Array.isArray(settings.paye_brackets)
      ? settings.paye_brackets as TaxSettings['paye_brackets']
      : DEFAULT_TAX_SETTINGS.paye_brackets,
  }
}

export function normalizeTaxEntry(row: any): TaxEntry {
  return {
    ...row,
    sales_vat_exclusive: toNumber(row.sales_vat_exclusive, 0),
    exempt_sales: toNumber(row.exempt_sales, 0),
    deductible_expenses: toNumber(row.deductible_expenses, 0),
    input_vat: toNumber(row.input_vat, 0),
    payroll_gross: toNumber(row.payroll_gross, 0),
    paye_withheld: toNumber(row.paye_withheld, 0),
    employee_count: toNumber(row.employee_count, 0),
  }
}

export function taxEntryToCalculationInput(entry: TaxEntry): TaxEntryInput {
  return {
    entry_date: entry.entry_date,
    period_type: entry.period_type,
    sales_vat_exclusive: entry.sales_vat_exclusive,
    exempt_sales: entry.exempt_sales,
    deductible_expenses: entry.deductible_expenses,
    input_vat: entry.input_vat,
    payroll_gross: entry.payroll_gross,
    paye_withheld: entry.paye_withheld,
    employee_count: entry.employee_count,
  }
}

export function taxSettingsToDb(settings: Partial<TaxSettings>) {
  return {
    vat_registered: Boolean(settings.vat_registered),
    vat_rate: boundedRate(settings.vat_rate, DEFAULT_TAX_SETTINGS.vat_rate),
    vat_registration_threshold: money(settings.vat_registration_threshold),
    income_tax_rate: boundedRate(settings.income_tax_rate, DEFAULT_TAX_SETTINGS.income_tax_rate),
    sdl_rate: boundedRate(settings.sdl_rate, DEFAULT_TAX_SETTINGS.sdl_rate),
    sdl_employee_threshold: Math.max(0, Math.round(Number(settings.sdl_employee_threshold) || DEFAULT_TAX_SETTINGS.sdl_employee_threshold)),
    nssf_employee_rate: boundedRate(settings.nssf_employee_rate, DEFAULT_TAX_SETTINGS.nssf_employee_rate),
    nssf_employer_rate: boundedRate(settings.nssf_employer_rate, DEFAULT_TAX_SETTINGS.nssf_employer_rate),
    paye_due_day: clampDay(settings.paye_due_day, DEFAULT_TAX_SETTINGS.paye_due_day),
    vat_due_day: clampDay(settings.vat_due_day, DEFAULT_TAX_SETTINGS.vat_due_day),
    income_tax_installment_months: settings.income_tax_installment_months?.length
      ? settings.income_tax_installment_months.map((month) => Math.min(Math.max(Math.round(month), 1), 12))
      : DEFAULT_TAX_SETTINGS.income_tax_installment_months,
    paye_brackets: settings.paye_brackets || DEFAULT_TAX_SETTINGS.paye_brackets,
    source_note: TAX_SOURCE_NOTE,
  }
}

export function taxEntryToDb(body: Record<string, unknown>, businessId: string) {
  const periodType = body.period_type === 'monthly' ? 'monthly' : 'daily'
  return {
    business_id: businessId,
    entry_date: normalizeDate(String(body.entry_date || ''), periodType),
    period_type: periodType,
    sales_vat_exclusive: money(body.sales_vat_exclusive),
    exempt_sales: money(body.exempt_sales),
    deductible_expenses: money(body.deductible_expenses),
    input_vat: money(body.input_vat),
    payroll_gross: money(body.payroll_gross),
    paye_withheld: money(body.paye_withheld),
    employee_count: Math.max(0, Math.round(Number(body.employee_count) || 0)),
    notes: String(body.notes || '').trim() || null,
  }
}

function normalizeDate(value: string, periodType: 'daily' | 'monthly') {
  if (periodType === 'monthly' && /^\d{4}-\d{2}$/.test(value)) return `${value}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Date().toISOString().slice(0, 10)
}

function boundedRate(value: unknown, fallback: number) {
  return Math.min(Math.max(toNumber(value, fallback), 0), 100)
}

function clampDay(value: unknown, fallback: number) {
  return Math.min(Math.max(Math.round(toNumber(value, fallback)), 1), 31)
}

function money(value: unknown) {
  return Math.max(toNumber(value, 0), 0)
}

function toNumber(value: unknown, fallback: number) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}
