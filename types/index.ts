// ============================================================
// Blackwhite — Core Types
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

export interface Client {
  id: string
  business_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  tin?: string
}

export type MongikeFeePayer = 'MERCHANT' | 'CUSTOMER'

export interface MongikePaymentRequest {
  orderId: string
  amount: number
  buyerPhone: string
  buyerName?: string
  buyerEmail?: string
  feePayer?: MongikeFeePayer
  metadata?: Record<string, unknown>
}

export interface MongikePaymentData {
  id: string
  order_id: string
  gateway_ref: string
  amount: number
  status: string
  expires_at: string
}

export interface MongikePaymentResponse {
  status: string
  message: string
  data: MongikePaymentData
}

export interface MongikeErrorResponse {
  status?: string
  message: string
  errors?: Record<string, string[]>
}

export type UsagePaymentType =
  | 'invoice_pdf'
  | 'payslip_pdf'
  | 'email_share'
  | 'whatsapp_share'
  | 'document_generation'

export interface UsagePayment {
  id: string
  user_id: string
  business_id: string
  document_type: 'invoice' | 'payslip' | 'document'
  document_id?: string
  request_type: UsagePaymentType
  provider: 'mongike'
  gateway_ref?: string
  provider_payment_id?: string
  order_id: string
  status?: string
  amount: number
  currency: 'TZS'
  expires_at?: string
  metadata?: Record<string, unknown>
  created_at: string
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
