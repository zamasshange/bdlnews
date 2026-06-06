import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/auth'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET() {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ media: [] })
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ media: data })
}

export async function POST(request: Request) {
  const user = await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  const folder = String(formData.get('folder') ?? 'uploads').replace(/[^a-z0-9/_-]+/gi, '-')
  const type = String(formData.get('type') ?? file.type.split('/')[0] ?? 'document')
  const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]+/gi, '-')}`
  const supabase = createSupabaseAdminClient()
  const upload = await supabase.storage.from('bdl-media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 400 })

  const { data: publicUrl } = supabase.storage.from('bdl-media').getPublicUrl(upload.data.path)
  const inserted = await supabase
    .from('media')
    .insert({
      name: file.name,
      url: publicUrl.publicUrl,
      type,
      folder,
      size_bytes: file.size,
      uploaded_by: user.auth.id,
    })
    .select()
    .single()

  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 400 })
  return NextResponse.json({ media: inserted.data })
}
