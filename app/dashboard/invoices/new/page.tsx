import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/InvoiceForm'
import { getServerT } from '@/lib/i18n/server'

export default async function NewInvoicePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { t } = getServerT()

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/dashboard')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('invoices.newTitle')}</h1>
          <p className="text-sm text-ink-400 mt-1">{t('invoices.newSubtitle')}</p>
        </div>
      </div>
      <InvoiceForm business={business} />
    </div>
  )
}
