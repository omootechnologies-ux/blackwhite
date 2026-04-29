'use client'

import { useI18n } from './LanguageProvider'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 text-xs"
      aria-label={t('common.language')}
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
          locale === 'en'
            ? 'bg-ink-900 text-white'
            : 'text-ink-500 hover:text-ink-900'
        }`}
      >
        {compact ? 'EN' : t('common.english')}
      </button>
      <button
        type="button"
        onClick={() => setLocale('sw')}
        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
          locale === 'sw'
            ? 'bg-ink-900 text-white'
            : 'text-ink-500 hover:text-ink-900'
        }`}
      >
        {compact ? 'SW' : t('common.swahili')}
      </button>
    </div>
  )
}
