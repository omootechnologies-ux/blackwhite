import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calcPAYE,
  calculatePayroll,
  calculateTaxCompliance,
  DEFAULT_TAX_SETTINGS,
} from '../lib/tax'

test('calculates PAYE from the configured monthly brackets', () => {
  assert.equal(Math.round(calcPAYE(270_000)), 0)
  assert.equal(Math.round(calcPAYE(520_000)), 20_000)
  assert.equal(Math.round(calcPAYE(760_000)), 68_000)
  assert.equal(Math.round(calcPAYE(1_000_000)), 128_000)
  assert.equal(Math.round(calcPAYE(1_500_000)), 278_000)
})

test('calculates payroll with PAYE after employee NSSF', () => {
  const payroll = calculatePayroll(1_000_000, [], [])

  assert.equal(payroll.nssf_employee, 100_000)
  assert.equal(payroll.nssf_employer, 100_000)
  assert.equal(payroll.paye, 103_000)
  assert.equal(payroll.total_deductions, 203_000)
  assert.equal(payroll.net_pay, 797_000)
})

test('summarizes VAT, SDL, PAYE, and income tax for a VAT registered business', () => {
  const summary = calculateTaxCompliance(
    [
      {
        entry_date: '2026-04-15',
        period_type: 'monthly',
        sales_vat_exclusive: 10_000_000,
        exempt_sales: 1_000_000,
        deductible_expenses: 3_000_000,
        input_vat: 1_000_000,
        payroll_gross: 3_000_000,
        paye_withheld: 300_000,
        employee_count: 10,
      },
    ],
    { ...DEFAULT_TAX_SETTINGS, vat_registered: true },
    '2026-04',
    new Date('2026-04-20T00:00:00Z')
  )

  assert.equal(summary.outputVat, 1_800_000)
  assert.equal(summary.vatPayable, 800_000)
  assert.equal(summary.sdlDue, 105_000)
  assert.equal(summary.payeDue, 300_000)
  assert.equal(summary.profitEstimate, 5_000_000)
  assert.equal(summary.incomeTaxEstimate, 1_500_000)
  assert.equal(summary.totalMonthlyProvision, 2_705_000)
})

test('does not charge VAT when the business is not VAT registered but tracks threshold progress', () => {
  const summary = calculateTaxCompliance(
    [
      {
        entry_date: '2026-04-15',
        period_type: 'monthly',
        sales_vat_exclusive: 20_000_000,
        exempt_sales: 0,
        deductible_expenses: 0,
        input_vat: 500_000,
        payroll_gross: 0,
        paye_withheld: 0,
        employee_count: 0,
      },
    ],
    { ...DEFAULT_TAX_SETTINGS, vat_registered: false, vat_registration_threshold: 200_000_000 },
    '2026-04',
    new Date('2026-04-20T00:00:00Z')
  )

  assert.equal(summary.outputVat, 0)
  assert.equal(summary.vatPayable, 0)
  assert.equal(summary.vatCredit, 500_000)
  assert.equal(summary.annualizedTaxableSales, 240_000_000)
  assert.equal(summary.vatThresholdProgress, 120)
})
