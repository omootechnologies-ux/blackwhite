import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SidebarNav } from '@/components/ui/SidebarNav'
import { ensureUserWorkspace } from '@/lib/auth/provision'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { getServerT } from '@/lib/i18n/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { t } = getServerT()
  const { business } = await ensureUserWorkspace(supabase, user)

  if (!business) redirect('/login')

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full bg-white border-b border-ink-200 flex flex-col lg:w-60 lg:border-b-0 lg:border-r lg:sticky lg:top-0 lg:h-screen">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-ink-100">
          <span className="font-display text-lg text-ink-900">
            Blackwhite
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
              <p className="text-xs text-ink-400">{t('common.tanzania')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-ink-100 mt-auto space-y-1">
          <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-500 hover:text-ink-800 hover:bg-ink-50 rounded-lg transition-colors">
            <span>⚙️</span> {t('common.settings')}
          </Link>
          <div className="px-3 py-2">
            <LanguageSwitcher compact />
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-500 hover:text-ink-800 hover:bg-ink-50 rounded-lg transition-colors text-left">
              <span>🚪</span> {t('common.signOut')}
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
