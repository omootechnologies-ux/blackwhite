import { createServerClient, createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('businesses')
    .update(body)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  // Logo upload
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('logo') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const admin = createAdminClient()
  const ext = file.name.split('.').pop()
  const filename = `logos/${user.id}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('logos')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = admin.storage.from('logos').getPublicUrl(filename)
  await supabase.from('businesses').update({ logo_url: urlData.publicUrl }).eq('user_id', user.id)

  return NextResponse.json({ logo_url: urlData.publicUrl })
}
