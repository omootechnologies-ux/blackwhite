'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/components/i18n/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n/dictionary'

const navItems = [
  { href: '/dashboard', labelKey: 'common.dashboard', icon: '🏠', exact: true },
  { href: '/dashboard/invoices', labelKey: 'common.invoices', icon: '📄' },
  { href: '/dashboard/payslips', labelKey: 'common.payslips', icon: '💰' },
] satisfies { href: string; labelKey: TranslationKey; icon: string; exact?: boolean }[]

export function SidebarNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
