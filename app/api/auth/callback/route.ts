import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { ensureUserWorkspace } from '@/lib/auth/provision'
import { getSafeRedirectPath } from '@/lib/auth/redirect'
import { getSiteUrl } from '@/lib/site-url'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const siteUrl = getSiteUrl(requestUrl.origin)
  const redirectPath = getSafeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const loginUrl = new URL('/login', siteUrl)
      loginUrl.searchParams.set('error', 'confirmation_failed')
      loginUrl.searchParams.set('next', redirectPath)
      return NextResponse.redirect(loginUrl)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await ensureUserWorkspace(supabase, user)
    }
  }

  return NextResponse.redirect(new URL(redirectPath, siteUrl))
}
