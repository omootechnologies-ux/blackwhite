import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSafeRedirectPath } from '@/lib/auth/redirect'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value)
          })

          res = NextResponse.next({ request: req })

          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const nextPath = getSafeRedirectPath(req.nextUrl.searchParams.get('next'))
    return redirectWithCookies(new URL(nextPath, req.url), res)
  }

  // Protect dashboard routes
  if (!user && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', `${pathname}${req.nextUrl.search}`)

    return redirectWithCookies(loginUrl, res)
  }

  return res
}

function redirectWithCookies(url: URL, sourceResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)

  sourceResponse.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie
    redirectResponse.cookies.set(name, value, options)
  })

  return redirectResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
