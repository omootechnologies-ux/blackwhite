import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/SettingsForm'
import { SubscriptionCard } from '@/components/SubscriptionCard'
import { ensureUserWorkspace } from '@/lib/auth/provision'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { business, subscription } = await ensureUserWorkspace(supabase, user)

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
