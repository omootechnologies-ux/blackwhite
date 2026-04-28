// ============================================================
// Duka Manager — Core Types
// ============================================================

export interface Business {
  id: string
  user_id: string
  name: string
  address?: string
  phone?: string
  email?: string
  tin?: string
  vrn?: string
  logo_url?: string
  currency: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  description: string
  qty: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: string
  business_id: string
  number: string
  client_name: string
  client_phone?: string
  client_email?: string
  client_address?: string
  client_tin?: string
  items: InvoiceItem[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  notes?: string
  due_date?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  payment_link?: string
  pdf_url?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface Allowance {
  name: string
  amount: number
}

export interface Deduction {
  name: string
  amount: number
}

export interface Payslip {
  id: string
  business_id: string
  employee_name: string
  employee_id?: string
  position?: string
  month: string
  basic_salary: number
  allowances: Allowance[]
  gross: number
  paye: number
  nssf_employee: number
  nssf_employer: number
  other_deductions: Deduction[]
  total_deductions: number
  net_pay: number
  pdf_url?: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'starter' | 'business'
  status: 'trial' | 'active' | 'expired'
  trial_ends_at: string
  current_period_start?: string
  current_period_end?: string
  created_at: string
}

export interface Client {
  id: string
  business_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  tin?: string
}

// Azam Pay
export interface AzamTokenResponse {
  data: { accessToken: string }
  message: string
  success: boolean
}

export interface AzamCheckoutResponse {
  paymentLink?: string
  message: string
  success: boolean
}

// Form types
export type InvoiceFormData = {
  client_name: string
  client_phone: string
  client_email: string
  client_address: string
  client_tin: string
  items: Omit<InvoiceItem, 'id' | 'amount'>[]
  notes: string
  due_date: string
  vat_rate: number
}

export type PayslipFormData = {
  employee_name: string
  employee_id: string
  position: string
  month: string
  basic_salary: number
  allowances: Allowance[]
  other_deductions: Deduction[]
}
