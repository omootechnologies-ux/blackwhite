import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
