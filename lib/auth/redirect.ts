const DEFAULT_REDIRECT_PATH = '/dashboard'

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH
) {
  const safeFallback = isSafeLocalPath(fallback) ? fallback : DEFAULT_REDIRECT_PATH

  if (!value) return safeFallback

  const path = value.trim()
  if (!isSafeLocalPath(path)) return safeFallback

  return path
}

function isSafeLocalPath(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
}
