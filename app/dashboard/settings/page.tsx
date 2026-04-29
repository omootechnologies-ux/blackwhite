import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/SettingsForm'
import { UsagePricingCard } from '@/components/UsagePricingCard'
import { ensureUserWorkspace } from '@/lib/auth/provision'
import { getServerT } from '@/lib/i18n/server'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = getServerT()
  const { business } = await ensureUserWorkspace(supabase, user)

  if (!business) redirect('/dashboard')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="text-sm text-ink-400 mt-1">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <SettingsForm business={business} />
        </div>
        <div>
          <UsagePricingCard />
        </div>
      </div>
    </div>
  )
}
