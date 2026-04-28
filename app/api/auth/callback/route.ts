import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const businessName = String(user.user_metadata?.business_name || 'Biashara Yangu')
      const phone = String(user.user_metadata?.phone || '')

      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingBusiness) {
        await supabase.from('businesses').insert({
          user_id: user.id,
          name: businessName,
          phone,
          currency: 'TZS',
        })
      }

      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingSubscription) {
        await supabase.from('subscriptions').insert({
          user_id: user.id,
          plan: 'business',
          status: 'trial',
        })
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
