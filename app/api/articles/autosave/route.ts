import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/auth'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
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

  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable
  const isArticlesTable = table === 'articles'

  const fallbackPayload: Record<string, any> = {
    title: headline,
    content: String(body.content ?? ''),
  }
  const featuredImage = String(body.featured_image ?? '').trim()
  if (featuredImage) fallbackPayload.featured_image = featuredImage
  const categoryName = String(body.category_name ?? '').trim()
  if (categoryName) fallbackPayload.category = categoryName
  const seoTitle = String(body.seo_title ?? '').trim()
  if (seoTitle) fallbackPayload.seo_title = seoTitle
  const seoDescription = String(body.seo_description ?? '').trim()
  if (seoDescription) fallbackPayload.seo_description = seoDescription
  const publishDate = String(body.publish_date ?? '').trim()
  if (publishDate) fallbackPayload.publish_date = publishDate

  const payload = isArticlesTable
    ? {
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
    : fallbackPayload

  const result = body.id
    ? await supabase.from(table).update(payload).eq('id', body.id).select('id').single()
    : await supabase.from(table).insert({ ...payload, ...(isArticlesTable ? { created_by: user.auth.id } : {}) }).select('id').single()

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
  return NextResponse.json({ id: result.data.id })
}
