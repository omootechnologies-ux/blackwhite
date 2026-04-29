import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { normalizeTaxEntry, taxEntryToDb } from '@/lib/tax-data'

async function getBusinessContext() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, business: null }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return { supabase, user, business }
}

export async function POST(req: NextRequest) {
  const { supabase, user, business } = await getBusinessContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const entry = taxEntryToDb(body, business.id)

  if (
    entry.sales_vat_exclusive <= 0 &&
    entry.exempt_sales <= 0 &&
    entry.deductible_expenses <= 0 &&
    entry.input_vat <= 0 &&
    entry.payroll_gross <= 0 &&
    entry.paye_withheld <= 0
  ) {
    return NextResponse.json({ error: 'Enter at least one sales, expense, VAT, or payroll amount.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tax_entries')
    .insert(entry)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(normalizeTaxEntry(data))
}
