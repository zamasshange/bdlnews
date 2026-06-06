import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/auth'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function list(value: unknown) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean)
}

export async function POST(request: Request) {
  const user = await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const headline = String(body.headline ?? '').trim()
  if (!headline) return NextResponse.json({ error: 'Headline is required for autosave' }, { status: 400 })

  const payload = {
    headline,
    slug: slugify(String(body.slug || headline)),
    subtitle: String(body.subtitle ?? ''),
    content: String(body.content ?? ''),
    featured_image: String(body.featured_image ?? ''),
    gallery_images: list(body.gallery_images),
    video_url: String(body.video_url ?? ''),
    author_id: body.author_id || null,
    category_id: body.category_id || null,
    seo_title: String(body.seo_title ?? ''),
    seo_description: String(body.seo_description ?? ''),
    seo_keywords: list(body.seo_keywords),
    status: body.status === 'published' || body.status === 'breaking' ? body.status : 'draft',
    publish_date: body.status === 'published' || body.status === 'breaking' ? new Date().toISOString() : null,
    updated_by: user.auth.id,
    updated_at: new Date().toISOString(),
  }

  const supabase = createSupabaseAdminClient()
  const result = body.id
    ? await supabase.from('articles').update(payload).eq('id', body.id).select('id').single()
    : await supabase.from('articles').insert({ ...payload, created_by: user.auth.id }).select('id').single()

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
  return NextResponse.json({ id: result.data.id })
}
