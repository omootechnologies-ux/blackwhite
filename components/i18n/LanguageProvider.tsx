'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_LOCALE,
  LANGUAGE_COOKIE,
  type Locale,
  type TranslationKey,
  resolveLocale,
  translate,
} from '@/lib/i18n/dictionary'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, variables) => translate(DEFAULT_LOCALE, key, variables),
})

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale))

  const value = useMemo<I18nContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      const safeLocale = resolveLocale(nextLocale)
      setLocaleState(safeLocale)
      window.localStorage.setItem(LANGUAGE_COOKIE, safeLocale)
      document.cookie = `${LANGUAGE_COOKIE}=${safeLocale}; path=/; max-age=31536000; samesite=lax`
      router.refresh()
    }

    return {
      locale,
      setLocale,
      t: (key, variables) => translate(locale, key, variables),
    }
  }, [locale, router])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
