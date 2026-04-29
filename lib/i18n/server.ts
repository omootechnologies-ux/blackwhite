import { cookies } from 'next/headers'
import { LANGUAGE_COOKIE, type TranslationKey, resolveLocale, translate } from './dictionary'

export function getServerLocale() {
  return resolveLocale(cookies().get(LANGUAGE_COOKIE)?.value)
}

export function getServerT() {
  const locale = getServerLocale()

  return {
    locale,
    t: (key: TranslationKey, variables?: Record<string, string | number>) =>
      translate(locale, key, variables),
  }
}
