import { getSafeRedirectPath } from '@/lib/auth/redirect'

const LOCAL_SITE_URL = 'http://localhost:3000'

function cleanBaseUrl(url: string | undefined | null) {
  return url?.trim().replace(/\/+$/, '')
}

function cleanVercelUrl(url: string | undefined | null) {
  const cleanUrl = cleanBaseUrl(url)
  if (!cleanUrl) return null
  return cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`
}

export function getSiteUrl(origin?: string | null) {
  const requestOrigin = cleanBaseUrl(origin)
  if (requestOrigin) return requestOrigin

  const configuredUrl = cleanBaseUrl(process.env.NEXT_PUBLIC_BASE_URL)
  if (configuredUrl) return configuredUrl

  const vercelProductionUrl = cleanVercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (vercelProductionUrl) return vercelProductionUrl

  const vercelUrl = cleanVercelUrl(process.env.VERCEL_URL)
  if (vercelUrl) return vercelUrl

  return LOCAL_SITE_URL
}

export function getAuthCallbackUrl(origin?: string | null, next?: string | null) {
  const callbackUrl = new URL('/api/auth/callback', getSiteUrl(origin))
  callbackUrl.searchParams.set('next', getSafeRedirectPath(next))

  return callbackUrl.toString()
}
