import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BUSINESS_LOGOS_BUCKET, LEGACY_LOGOS_BUCKET } from '@/lib/documents'
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
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Logo must be an image file' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Logo must be 5MB or smaller' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const admin = createAdminClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filename = `${user.id}/logo.${ext}`

  const upload = await uploadLogo(admin, BUSINESS_LOGOS_BUCKET, filename, buffer, file.type)
  const finalUpload = upload.error && upload.error.message.toLowerCase().includes('bucket')
    ? await uploadLogo(admin, LEGACY_LOGOS_BUCKET, filename, buffer, file.type)
    : upload

  if (finalUpload.error) return NextResponse.json({ error: finalUpload.error.message }, { status: 500 })

  const { data: urlData } = admin.storage.from(finalUpload.bucket).getPublicUrl(filename)
  const { error: updateError } = await supabase
    .from('businesses')
    .update({ logo_url: urlData.publicUrl })
    .eq('user_id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ logo_url: urlData.publicUrl })
}

async function uploadLogo(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  filename: string,
  buffer: Buffer,
  contentType: string
) {
  const { error } = await admin.storage
    .from(bucket)
    .upload(filename, buffer, { contentType, upsert: true })

  return { bucket, error }
}
