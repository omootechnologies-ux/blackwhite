import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-display text-2xl text-white">
            Blackwhite
          </a>
          <div className="mt-4">
            <LanguageSwitcher compact />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
