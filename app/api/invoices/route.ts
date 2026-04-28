import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { calculateInvoiceTotals } from '@/lib/tax'
import { uid } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('id').eq('user_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const body = await req.json()
  const { items, vat_rate = 18, ...rest } = body

  // Enrich items with amounts
  const enrichedItems = items.map((item: any) => ({
    ...item,
    id: uid(),
    amount: item.qty * item.unit_price,
  }))

  const { subtotal, vat_amount, total } = calculateInvoiceTotals(items, vat_rate)

  // Get next invoice number
  const { data: numData } = await supabase.rpc('next_invoice_number', {
    p_business_id: business.id,
  })

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      business_id: business.id,
      number: numData,
      items: enrichedItems,
      subtotal,
      vat_rate,
      vat_amount,
      total,
      status: 'draft',
      ...rest,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(invoice)
}
