import Link from 'next/link'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { getServerT } from '@/lib/i18n/server'

export default function HomePage() {
  const { t } = getServerT()
  const features = [
    {
      icon: '📄',
      title: t('home.feature.invoice.title'),
      desc: t('home.feature.invoice.desc'),
    },
    {
      icon: '💰',
      title: t('home.feature.payslip.title'),
      desc: t('home.feature.payslip.desc'),
    },
    {
      icon: '📱',
      title: t('home.feature.share.title'),
      desc: t('home.feature.share.desc'),
    },
  ]

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="font-display text-xl text-white">
          Blackwhite
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link href="/login" className="text-sm text-ink-300 hover:text-white transition-colors">
            {t('home.nav.login')}
          </Link>
          <Link
            href="/register"
            className="text-sm bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-400 transition-colors font-medium"
          >
            {t('home.nav.signup')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          {t('home.badge')}
        </div>

        <h1 className="font-display text-5xl md:text-6xl text-white leading-tight mb-6 animate-fade-up">
          {t('home.title.line1')}
          <br />
          <span className="text-brand-400">{t('home.title.line2')}</span>
        </h1>

        <p className="text-ink-400 text-lg max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '80ms' }}>
          {t('home.subtitle')}
        </p>

        <div className="flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-400 transition-colors"
          >
            {t('home.cta')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <span className="text-xs text-ink-500">{t('home.ctaNote')}</span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {features.map((f) => (
            <div key={f.title} className="bg-ink-900 border border-ink-800 rounded-xl p-6 hover:border-ink-700 transition-colors">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-ink-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="font-display text-3xl text-white text-center mb-12">{t('home.pricing.title')}</h2>
        <div className="max-w-md mx-auto">
          <div className="bg-ink-900 border border-ink-800 rounded-xl p-6">
            <div className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">
              {t('home.pricing.cardTitle')}
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl text-white">{t('home.pricing.price')}</span>
              <span className="text-ink-400 text-sm">{t('home.pricing.perRequest')}</span>
            </div>
            <p className="text-sm text-ink-400 mb-6">{t('home.pricing.copy')}</p>
            <ul className="space-y-2.5 text-sm text-ink-300 mb-8">
              {[t('home.pricing.item1'), t('home.pricing.item2'), t('home.pricing.item3')].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-brand-400 text-xs">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-2.5 rounded-lg border border-ink-700 text-sm text-white hover:bg-ink-800 transition-colors">
              {t('home.pricing.button')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-ink-800 py-8 text-center">
        <p className="text-xs text-ink-600">
          © {new Date().getFullYear()} Blackwhite · blackwhite.co.tz · Dar es Salaam, Tanzania
        </p>
      </div>
    </div>
  )
}
