import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Business } from '@/types'

type Workspace = {
  business: Business | null
}

export async function ensureUserWorkspace(
  supabase: SupabaseClient,
  user: User
): Promise<Workspace> {
  const businessName = String(
    user.user_metadata?.business_name || user.email?.split('@')[0] || 'Biashara Yangu'
  )
  const phone = String(user.user_metadata?.phone || '')

  const { data: existingBusiness, error: businessReadError } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (businessReadError) throw businessReadError

  let business = existingBusiness as Business | null

  if (!business) {
    const { data: createdBusiness, error: businessCreateError } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name: businessName,
        phone,
        currency: 'TZS',
      })
      .select('*')
      .single()

    if (businessCreateError) {
      if (businessCreateError.code !== '23505') throw businessCreateError

      const { data: racedBusiness, error: racedBusinessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (racedBusinessError) throw racedBusinessError
      business = racedBusiness as Business | null
    } else {
      business = createdBusiness as Business
    }
  }

  return { business }
}
