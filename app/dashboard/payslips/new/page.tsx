import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PayslipForm } from '@/components/PayslipForm'

export default async function NewPayslipPage() {
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
          <h1 className="page-title">Payslip Mpya</h1>
          <p className="text-sm text-ink-400 mt-1">PAYE na NSSF itahesabiwa kiotomatiki</p>
        </div>
      </div>
      <PayslipForm business={business} />
    </div>
  )
}
