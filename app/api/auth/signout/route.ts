import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { getSiteUrl } from '@/lib/site-url'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(new URL('/login', getSiteUrl(requestUrl.origin)), 303)
}
