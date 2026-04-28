import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/SettingsForm'
import { SubscriptionCard } from '@/components/SubscriptionCard'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: business }, { data: subscription }] = await Promise.all([
    supabase.from('businesses').select('*').eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  if (!business) redirect('/dashboard')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mipangilio</h1>
          <p className="text-sm text-ink-400 mt-1">Maelezo ya biashara yako</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <SettingsForm business={business} />
        </div>
        <div>
          <SubscriptionCard subscription={subscription} />
        </div>
      </div>
    </div>
  )
}
