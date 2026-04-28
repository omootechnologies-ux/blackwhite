import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/InvoiceForm'

export default async function NewInvoicePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('user_id', user.id).single()
  if (!business) redirect('/dashboard')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Mpya</h1>
          <p className="text-sm text-ink-400 mt-1">Jaza maelezo hapa chini</p>
        </div>
      </div>
      <InvoiceForm business={business} />
    </div>
  )
}
