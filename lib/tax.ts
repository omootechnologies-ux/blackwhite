// ============================================================
// Tanzania tax helpers
// Defaults are intentionally configurable; TRA rates and filing rules change.
// ============================================================

export type PayeBracket = {
  over: number
  notOver: number | null
  baseTax: number
  rate: number
}

export type TaxSettings = {
  vat_registered: boolean
  vat_rate: number
  vat_registration_threshold: number
  income_tax_rate: number
  sdl_rate: number
  sdl_employee_threshold: number
  nssf_employee_rate: number
  nssf_employer_rate: number
  paye_due_day: number
  vat_due_day: number
  income_tax_installment_months: number[]
  paye_brackets: PayeBracket[]
}

export type TaxEntryInput = {
  entry_date: string
  period_type: 'daily' | 'monthly'
  sales_vat_exclusive: number
  exempt_sales: number
  deductible_expenses: number
  input_vat: number
  payroll_gross: number
  paye_withheld: number
  employee_count: number
}

export type TaxReminder = {
  title: string
  detail: string
  dueDate: string
  amount?: number
  status: 'overdue' | 'due_soon' | 'upcoming' | 'info'
}

export type TaxComplianceSummary = {
  taxableSales: number
  exemptSales: number
  totalSales: number
  deductibleExpenses: number
  payrollGross: number
  payeDue: number
  outputVat: number
  inputVat: number
  vatPayable: number
  vatCredit: number
  sdlDue: number
  profitEstimate: number
  incomeTaxEstimate: number
  annualizedTaxableSales: number
  vatThresholdProgress: number
  totalMonthlyProvision: number
  reminders: TaxReminder[]
}

export const DEFAULT_PAYE_BRACKETS: PayeBracket[] = [
  { over: 0, notOver: 270_000, baseTax: 0, rate: 0 },
  { over: 270_000, notOver: 520_000, baseTax: 0, rate: 8 },
  { over: 520_000, notOver: 760_000, baseTax: 20_000, rate: 20 },
  { over: 760_000, notOver: 1_000_000, baseTax: 68_000, rate: 25 },
  { over: 1_000_000, notOver: null, baseTax: 128_000, rate: 30 },
]

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  vat_registered: false,
  vat_rate: 18,
  vat_registration_threshold: 200_000_000,
  income_tax_rate: 30,
  sdl_rate: 3.5,
  sdl_employee_threshold: 10,
  nssf_employee_rate: 10,
  nssf_employer_rate: 10,
  paye_due_day: 7,
  vat_due_day: 20,
  income_tax_installment_months: [3, 6, 9, 12],
  paye_brackets: DEFAULT_PAYE_BRACKETS,
}

// Backwards-compatible export for invoice forms.
export const VAT_RATE = DEFAULT_TAX_SETTINGS.vat_rate

export function resolveTaxSettings(settings?: Partial<TaxSettings> | null): TaxSettings {
  return {
    ...DEFAULT_TAX_SETTINGS,
    ...(settings || {}),
    paye_brackets: settings?.paye_brackets?.length
      ? settings.paye_brackets
      : DEFAULT_TAX_SETTINGS.paye_brackets,
    income_tax_installment_months: settings?.income_tax_installment_months?.length
      ? settings.income_tax_installment_months
      : DEFAULT_TAX_SETTINGS.income_tax_installment_months,
  }
}

export function calcPAYE(monthlyTaxablePay: number, settings?: Partial<TaxSettings> | null): number {
  const resolved = resolveTaxSettings(settings)
  const taxablePay = Math.max(Number(monthlyTaxablePay) || 0, 0)
  const bracket = resolved.paye_brackets.find((item) => {
    const aboveLowerBound = taxablePay > item.over || (item.over === 0 && taxablePay >= 0)
    const belowUpperBound = item.notOver === null || taxablePay <= item.notOver
    return aboveLowerBound && belowUpperBound
  }) || resolved.paye_brackets[resolved.paye_brackets.length - 1]

  return bracket.baseTax + Math.max(taxablePay - bracket.over, 0) * (bracket.rate / 100)
}

export function calcNSSF(
  gross: number,
  settings?: Partial<TaxSettings> | null
): { employee: number; employer: number } {
  const resolved = resolveTaxSettings(settings)
  return {
    employee: Math.round(gross * (resolved.nssf_employee_rate / 100)),
    employer: Math.round(gross * (resolved.nssf_employer_rate / 100)),
  }
}

export interface PayrollResult {
  basic_salary: number
  allowances_total: number
  gross: number
  paye: number
  nssf_employee: number
  nssf_employer: number
  other_deductions_total: number
  total_deductions: number
  net_pay: number
}

export function calculatePayroll(
  basic_salary: number,
  allowances: { name: string; amount: number }[],
  other_deductions: { name: string; amount: number }[],
  settings?: Partial<TaxSettings> | null
): PayrollResult {
  const allowances_total = allowances.reduce((s, a) => s + a.amount, 0)
  const gross = basic_salary + allowances_total

  const { employee: nssf_employee, employer: nssf_employer } = calcNSSF(gross, settings)
  const payeTaxablePay = Math.max(gross - nssf_employee, 0)
  const paye = Math.round(calcPAYE(payeTaxablePay, settings))
  const other_deductions_total = other_deductions.reduce((s, d) => s + d.amount, 0)

  const total_deductions = paye + nssf_employee + other_deductions_total
  const net_pay = gross - total_deductions

  return {
    basic_salary,
    allowances_total,
    gross,
    paye,
    nssf_employee,
    nssf_employer,
    other_deductions_total,
    total_deductions,
    net_pay,
  }
}

export function calculateInvoiceTotals(
  items: { qty: number; unit_price: number }[],
  vatRate: number = VAT_RATE
) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const vat_amount = Math.round(subtotal * (vatRate / 100))
  const total = subtotal + vat_amount
  return { subtotal, vat_amount, total }
}

export function calculateTaxCompliance(
  entries: TaxEntryInput[],
  settings?: Partial<TaxSettings> | null,
  periodMonth = currentTaxMonth(),
  today = new Date()
): TaxComplianceSummary {
  const resolved = resolveTaxSettings(settings)
  const monthEntries = entries.filter((entry) => entry.entry_date.startsWith(periodMonth))
  const taxableSales = sum(monthEntries, 'sales_vat_exclusive')
  const exemptSales = sum(monthEntries, 'exempt_sales')
  const deductibleExpenses = sum(monthEntries, 'deductible_expenses')
  const inputVat = sum(monthEntries, 'input_vat')
  const payrollGross = sum(monthEntries, 'payroll_gross')
  const payeDue = sum(monthEntries, 'paye_withheld')
  const employeeCount = Math.max(0, ...monthEntries.map((entry) => Number(entry.employee_count) || 0))
  const outputVat = resolved.vat_registered
    ? Math.round(taxableSales * (resolved.vat_rate / 100))
    : 0
  const vatBalance = outputVat - inputVat
  const vatPayable = Math.max(vatBalance, 0)
  const vatCredit = Math.max(-vatBalance, 0)
  const sdlDue = employeeCount >= resolved.sdl_employee_threshold
    ? Math.round(payrollGross * (resolved.sdl_rate / 100))
    : 0
  const totalSales = taxableSales + exemptSales
  const profitEstimate = totalSales - deductibleExpenses - payrollGross
  const incomeTaxEstimate = Math.round(Math.max(profitEstimate, 0) * (resolved.income_tax_rate / 100))
  const annualizedTaxableSales = estimateAnnualizedTaxableSales(monthEntries, taxableSales, periodMonth, today)
  const vatThresholdProgress = resolved.vat_registration_threshold > 0
    ? Math.min((annualizedTaxableSales / resolved.vat_registration_threshold) * 100, 999)
    : 0
  const totalMonthlyProvision = payeDue + sdlDue + vatPayable + incomeTaxEstimate

  return {
    taxableSales,
    exemptSales,
    totalSales,
    deductibleExpenses,
    payrollGross,
    payeDue,
    outputVat,
    inputVat,
    vatPayable,
    vatCredit,
    sdlDue,
    profitEstimate,
    incomeTaxEstimate,
    annualizedTaxableSales,
    vatThresholdProgress,
    totalMonthlyProvision,
    reminders: buildTaxReminders({
      entries: monthEntries,
      settings: resolved,
      periodMonth,
      today,
      payeDue,
      payrollGross,
      sdlDue,
      vatPayable,
      incomeTaxEstimate,
      annualizedTaxableSales,
    }),
  }
}

function sum(entries: TaxEntryInput[], key: keyof TaxEntryInput) {
  return entries.reduce((total, entry) => total + (Number(entry[key]) || 0), 0)
}

function currentTaxMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function estimateAnnualizedTaxableSales(
  entries: TaxEntryInput[],
  taxableSales: number,
  periodMonth: string,
  today: Date
) {
  if (!entries.length) return 0

  const hasMonthlyEntry = entries.some((entry) => entry.period_type === 'monthly')
  if (hasMonthlyEntry) return taxableSales * 12

  const [year, month] = periodMonth.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)
  const elapsedDays = today < monthEnd && today >= monthStart
    ? today.getDate()
    : monthEnd.getDate()

  return (taxableSales / Math.max(elapsedDays, 1)) * 365
}

function buildTaxReminders(args: {
  entries: TaxEntryInput[]
  settings: TaxSettings
  periodMonth: string
  today: Date
  payeDue: number
  payrollGross: number
  sdlDue: number
  vatPayable: number
  incomeTaxEstimate: number
  annualizedTaxableSales: number
}): TaxReminder[] {
  const reminders: TaxReminder[] = []
  const todayIso = toISODate(args.today)

  if (!args.entries.some((entry) => entry.entry_date === todayIso)) {
    reminders.push({
      title: 'Record today sales and expenses',
      detail: 'Keep daily EFD, sales, purchase, payroll, and expense figures current before filing.',
      dueDate: todayIso,
      status: 'info',
    })
  }

  if (args.payrollGross > 0 || args.payeDue > 0) {
    const dueDate = nextMonthDueDate(args.periodMonth, args.settings.paye_due_day)
    reminders.push({
      title: 'PAYE monthly remittance',
      detail: 'Review employee withholding and remit the monthly PAYE amount.',
      dueDate,
      amount: args.payeDue,
      status: reminderStatus(dueDate, args.today),
    })
  }

  if (args.sdlDue > 0) {
    const dueDate = nextMonthDueDate(args.periodMonth, args.settings.paye_due_day)
    reminders.push({
      title: 'SDL employer levy',
      detail: `SDL applies because employee count is at least ${args.settings.sdl_employee_threshold}.`,
      dueDate,
      amount: args.sdlDue,
      status: reminderStatus(dueDate, args.today),
    })
  }

  if (args.settings.vat_registered) {
    const dueDate = nextMonthDueDate(args.periodMonth, args.settings.vat_due_day)
    reminders.push({
      title: 'VAT return and payment',
      detail: 'Reconcile output VAT, input VAT, EFD sales, and purchase records before filing.',
      dueDate,
      amount: args.vatPayable,
      status: reminderStatus(dueDate, args.today),
    })
  } else if (
    args.settings.vat_registration_threshold > 0 &&
    args.annualizedTaxableSales >= args.settings.vat_registration_threshold * 0.8
  ) {
    reminders.push({
      title: 'VAT registration threshold watch',
      detail: 'Annualized taxable sales are approaching the configured VAT registration threshold.',
      dueDate: todayIso,
      status: 'info',
    })
  }

  if (args.incomeTaxEstimate > 0) {
    const dueDate = nextIncomeTaxInstallmentDate(args.periodMonth, args.settings.income_tax_installment_months)
    reminders.push({
      title: 'Income tax instalment reserve',
      detail: 'Set aside the estimated instalment amount for the next provisional tax deadline.',
      dueDate,
      amount: args.incomeTaxEstimate,
      status: reminderStatus(dueDate, args.today),
    })
  }

  return reminders
}

function nextMonthDueDate(periodMonth: string, dueDay: number) {
  const [year, month] = periodMonth.split('-').map(Number)
  const date = new Date(year, month, 1)
  const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(Math.max(dueDay, 1), maxDay))
  return toISODate(date)
}

function nextIncomeTaxInstallmentDate(periodMonth: string, months: number[]) {
  const [year, month] = periodMonth.split('-').map(Number)
  const sortedMonths = [...months].sort((a, b) => a - b)
  const dueMonth = sortedMonths.find((item) => item >= month) || sortedMonths[0]
  const dueYear = dueMonth >= month ? year : year + 1
  const dueDate = new Date(dueYear, dueMonth, 0)
  return toISODate(dueDate)
}

function reminderStatus(dueDate: string, today: Date): TaxReminder['status'] {
  const due = new Date(`${dueDate}T00:00:00`)
  const current = new Date(toISODate(today) + 'T00:00:00')
  const days = Math.ceil((due.getTime() - current.getTime()) / 86_400_000)

  if (days < 0) return 'overdue'
  if (days <= 7) return 'due_soon'
  return 'upcoming'
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}
