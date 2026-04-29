import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  getOrCreateTaxSettings,
  normalizeStoredTaxSettings,
  taxSettingsToDb,
} from '@/lib/tax-data'

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

export async function GET() {
  const { supabase, user, business } = await getBusinessContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  try {
    const settings = await getOrCreateTaxSettings(supabase, business.id)
    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tax settings failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, business } = await getBusinessContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  try {
    await getOrCreateTaxSettings(supabase, business.id)

    const { data, error } = await supabase
      .from('tax_settings')
      .update(taxSettingsToDb(body))
      .eq('business_id', business.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json(normalizeStoredTaxSettings(data))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tax settings update failed' }, { status: 500 })
  }
}
