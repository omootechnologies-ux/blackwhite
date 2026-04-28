import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SidebarNav } from '@/components/ui/SidebarNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-ink-200 flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-ink-100">
          <span className="font-display text-lg text-ink-900">
            Duka <span className="text-brand-500">Manager</span>
          </span>
        </div>

        {/* Business info */}
        <div className="px-5 py-3 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            {business.logo_url ? (
              <img src={business.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                {business.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-800 truncate">{business.name}</p>
              <p className="text-xs text-ink-400">Tanzania</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-ink-100 mt-auto space-y-1">
          <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-500 hover:text-ink-800 hover:bg-ink-50 rounded-lg transition-colors">
            <span>⚙️</span> Mipangilio
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-500 hover:text-ink-800 hover:bg-ink-50 rounded-lg transition-colors text-left">
              <span>🚪</span> Toka
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
