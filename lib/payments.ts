import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Business, MongikePaymentData, UsagePaymentType } from '@/types'
import { initiateMongikeMobileMoneyPayment } from '@/lib/mongike'
import { USAGE_REQUEST_PRICE_TZS } from '@/lib/pricing'

type InitiateUsagePaymentArgs = {
  supabase: SupabaseClient
  user: User
  business: Business
  documentType: 'invoice' | 'payslip' | 'document'
  documentId?: string
  requestType: UsagePaymentType
  buyerPhone?: string | null
  buyerName?: string | null
  buyerEmail?: string | null
  metadata?: Record<string, unknown>
}

export async function initiateUsagePayment({
  supabase,
  user,
  business,
  documentType,
  documentId,
  requestType,
  buyerPhone,
  buyerName,
  buyerEmail,
  metadata,
}: InitiateUsagePaymentArgs): Promise<MongikePaymentData> {
  const payerPhone = buyerPhone || business.phone

  if (!payerPhone) {
    throw new Error('Add a business phone number in settings before starting a paid request.')
  }

  const orderId = createUsageOrderId(requestType, documentId)
  const response = await initiateMongikeMobileMoneyPayment({
    orderId,
    amount: USAGE_REQUEST_PRICE_TZS,
    buyerPhone: payerPhone,
    buyerName: buyerName || business.name,
    buyerEmail: buyerEmail || business.email || user.email || undefined,
    feePayer: 'MERCHANT',
    metadata: {
      type: requestType,
      document_type: documentType,
      document_id: documentId,
      business_id: business.id,
      user_id: user.id,
      amount: USAGE_REQUEST_PRICE_TZS,
      currency: 'TZS',
      ...metadata,
    },
  })

  await saveUsagePayment(supabase, {
    userId: user.id,
    businessId: business.id,
    documentType,
    documentId,
    requestType,
    payment: response.data,
    metadata,
  })

  return response.data
}

function createUsageOrderId(requestType: UsagePaymentType, documentId?: string) {
  const subject = (documentId || crypto.randomUUID()).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32)
  return `bw-${requestType}-${subject}-${Date.now()}`
}

async function saveUsagePayment(
  supabase: SupabaseClient,
  args: {
    userId: string
    businessId: string
    documentType: string
    documentId?: string
    requestType: UsagePaymentType
    payment: MongikePaymentData
    metadata?: Record<string, unknown>
  }
) {
  const { error } = await supabase.from('usage_payments').insert({
    user_id: args.userId,
    business_id: args.businessId,
    document_type: args.documentType,
    document_id: args.documentId || null,
    request_type: args.requestType,
    provider: 'mongike',
    gateway_ref: args.payment.gateway_ref,
    provider_payment_id: args.payment.id,
    order_id: args.payment.order_id,
    status: args.payment.status,
    expires_at: args.payment.expires_at,
    amount: args.payment.amount || USAGE_REQUEST_PRICE_TZS,
    currency: 'TZS',
    metadata: args.metadata || {},
  })

  if (error) {
    console.warn('usage_payments insert skipped:', error.message)
  }
}
