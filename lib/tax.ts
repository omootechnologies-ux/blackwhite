// ============================================================
// Tanzania PAYE Calculation — TRA rates 2024/25
// Monthly income tax brackets
// ============================================================

export function calcPAYE(monthlyGross: number): number {
  if (monthlyGross <= 270_000) return 0
  if (monthlyGross <= 520_000) return (monthlyGross - 270_000) * 0.08
  if (monthlyGross <= 760_000) return 20_000 + (monthlyGross - 520_000) * 0.20
  if (monthlyGross <= 1_000_000) return 68_000 + (monthlyGross - 760_000) * 0.25
  return 128_000 + (monthlyGross - 1_000_000) * 0.30
}

// NSSF: 10% of gross (5% employee + 5% employer)
// Capped at NSSF maximum pensionable earnings if applicable
export function calcNSSF(gross: number): { employee: number; employer: number } {
  const rate = 0.05
  return {
    employee: Math.round(gross * rate),
    employer: Math.round(gross * rate),
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
  other_deductions: { name: string; amount: number }[]
): PayrollResult {
  const allowances_total = allowances.reduce((s, a) => s + a.amount, 0)
  const gross = basic_salary + allowances_total

  const paye = Math.round(calcPAYE(gross))
  const { employee: nssf_employee, employer: nssf_employer } = calcNSSF(gross)
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

// Tanzania VAT rate
export const VAT_RATE = 18 // %

export function calculateInvoiceTotals(
  items: { qty: number; unit_price: number }[],
  vatRate: number = VAT_RATE
) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const vat_amount = Math.round(subtotal * (vatRate / 100))
  const total = subtotal + vat_amount
  return { subtotal, vat_amount, total }
}
