'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin/auth'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import type { ArticleStatus, CommentStatus, UserRole } from '@/lib/supabase/types'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function list(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function syncArticleTags(supabase: ReturnType<typeof createSupabaseAdminClient>, articleId: string, names: string[]) {
  if (supabaseNewsTable !== 'articles') return

  await supabase.from('article_tags').delete().eq('article_id', articleId)
  for (const name of names) {
    const slug = slugify(name)
    const tag = await supabase.from('tags').upsert({ name, slug }, { onConflict: 'slug' }).select('id').single()
    if (!tag.error && tag.data) {
      await supabase.from('article_tags').upsert({ article_id: articleId, tag_id: tag.data.id })
    }
  }
}

async function requireConfigured() {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }
  return createSupabaseAdminClient()
}

function revalidateNews() {
  revalidatePath('/')
  revalidatePath('/article/[slug]', 'page')
  revalidatePath('/category/[slug]', 'page')
}

export async function saveArticle(formData: FormData) {
  const user = await requireAdminUser()
  if (!hasSupabaseAdminConfig()) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }
  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable
  const isLegacyArticlesTable = table === 'articles'
  const id = String(formData.get('id') ?? '')
  const headline = String(formData.get('headline') ?? '').trim()
  const status = String(formData.get('status') ?? 'draft') as ArticleStatus
  const publishDate = String(formData.get('publish_date') || '')
  const keywords = list(formData.get('seo_keywords'))
  const tagNames = list(formData.get('tags')).length ? list(formData.get('tags')) : keywords

  const basePayload: Record<string, any> = {
    headline,
    subtitle: String(formData.get('subtitle') ?? ''),
    slug: slugify(String(formData.get('slug') || headline)),
    content: String(formData.get('content') ?? ''),
    featured_image: String(formData.get('featured_image') ?? ''),
    seo_title: String(formData.get('seo_title') ?? ''),
    seo_description: String(formData.get('seo_description') ?? ''),
    publish_date: publishDate || (status === 'published' || status === 'breaking' ? new Date().toISOString() : null),
    updated_at: new Date().toISOString(),
  }

  const fallbackPayload: Record<string, any> = {
    title: headline,
    content: String(formData.get('content') ?? ''),
  }
  const fallbackFeaturedImage = String(formData.get('featured_image') ?? '').trim()
  if (fallbackFeaturedImage) fallbackPayload.featured_image = fallbackFeaturedImage
  const fallbackCategoryName = String(formData.get('category_name') ?? '').trim()
  if (fallbackCategoryName) fallbackPayload.category = fallbackCategoryName
  const fallbackSeoTitle = String(formData.get('seo_title') ?? '').trim()
  if (fallbackSeoTitle) fallbackPayload.seo_title = fallbackSeoTitle
  const fallbackSeoDescription = String(formData.get('seo_description') ?? '').trim()
  if (fallbackSeoDescription) fallbackPayload.seo_description = fallbackSeoDescription
  const fallbackPublishDate = String(formData.get('publish_date') ?? '').trim()
  if (fallbackPublishDate) fallbackPayload.publish_date = fallbackPublishDate

  const payload: Record<string, any> = isLegacyArticlesTable
    ? {
        ...basePayload,
        gallery_images: list(formData.get('gallery_images')),
        video_url: String(formData.get('video_url') ?? ''),
        author_id: String(formData.get('author_id') ?? '') || null,
        category_id: String(formData.get('category_id') ?? '') || null,
        seo_keywords: keywords,
        status,
      }
    : fallbackPayload

  if (user.profileExists && isLegacyArticlesTable) {
    payload.updated_by = user.auth.id
    if (!id) payload.created_by = user.auth.id
  }

  const query = id
    ? supabase.from(table).update(payload).eq('id', id).select('id').single()
    : supabase.from(table).insert(payload).select('id').single()

  const result = await query
  if (result.error) {
    const message = String(result.error.message ?? 'An unknown error occurred while saving the article.')
    if (
      message.includes('Could not find the table') ||
      message.includes('does not exist') ||
      result.error.code === 'PGRST205' ||
      result.error.code === '42703'
    ) {
      throw new Error(`Failed to save article. The configured Supabase table "${table}" does not match the admin article schema. Ensure SUPABASE_NEWS_TABLE points to a valid article table or create the expected 'articles' schema in Supabase.`)
    }
    throw new Error(message)
  }

  if (isLegacyArticlesTable) {
    await syncArticleTags(supabase, result.data.id, tagNames)
  }

  revalidateNews()
  redirect('/admin/articles')
}

export async function deleteArticle(formData: FormData) {
  const supabase = await requireConfigured()
  const table = supabaseNewsTable
  const id = String(formData.get('id') ?? '')
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateNews()
  revalidatePath('/admin/articles')
}

export async function duplicateArticle(formData: FormData) {
  const supabase = await requireConfigured()
  const table = supabaseNewsTable
  const id = String(formData.get('id') ?? '')
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const { id: _id, created_at: _created, updated_at: _updated, ...article } = data as Record<string, any>
  const copy = { ...article }

  if ('headline' in copy && typeof copy.headline === 'string') {
    copy.headline = `${copy.headline} Copy`
  }
  if ('title' in copy && typeof copy.title === 'string') {
    copy.title = `${copy.title} Copy`
  }
  if ('slug' in copy) {
    copy.slug = slugify(String(copy.slug || copy.title || 'copy'))
  } else if ('title' in copy) {
    copy.slug = slugify(String(copy.title))
  }
  if ('status' in copy) copy.status = 'draft'
  if ('publish_date' in copy) copy.publish_date = null

  const inserted = await supabase.from(table).insert(copy)
  if (inserted.error) throw new Error(inserted.error.message)
  revalidatePath('/admin/articles')
}

export async function updateArticleStatus(formData: FormData) {
  const supabase = await requireConfigured()
  if (supabaseNewsTable !== 'articles') {
    throw new Error('Status update is not supported for the current SUPABASE_NEWS_TABLE configuration.')
  }
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? 'draft') as ArticleStatus
  const { error } = await supabase
    .from(supabaseNewsTable)
    .update({
      status,
      publish_date: status === 'published' || status === 'breaking' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidateNews()
  revalidatePath('/admin/articles')
}

export async function saveAuthor(formData: FormData) {
  const supabase = await requireConfigured()
  const id = String(formData.get('id') ?? '')
  const payload = {
    name: String(formData.get('name') ?? ''),
    profile_image: String(formData.get('profile_image') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    role: String(formData.get('role') ?? ''),
    expertise: list(formData.get('expertise')),
    social_links: {
      x: String(formData.get('x') ?? ''),
      linkedin: String(formData.get('linkedin') ?? ''),
      website: String(formData.get('website') ?? ''),
    },
  }
  const result = id
    ? await supabase.from('authors').update(payload).eq('id', id)
    : await supabase.from('authors').insert(payload)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/authors')
}

export async function saveCategory(formData: FormData) {
  const supabase = await requireConfigured()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '')
  const payload = {
    name,
    slug: slugify(String(formData.get('slug') || name)),
    description: String(formData.get('description') ?? ''),
  }
  const result = id
    ? await supabase.from('categories').update(payload).eq('id', id)
    : await supabase.from('categories').insert(payload)
  if (result.error) throw new Error(result.error.message)
  revalidateNews()
  revalidatePath('/admin/categories')
}

export async function saveLiveUpdate(formData: FormData) {
  const supabase = await requireConfigured()
  const payload = {
    headline: String(formData.get('headline') ?? ''),
    body: String(formData.get('body') ?? ''),
    status: String(formData.get('status') ?? 'live').toLowerCase(),
    category_id: String(formData.get('category_id') ?? '') || null,
    pinned: formData.get('pinned') === 'on',
    reader_count: Number(formData.get('reader_count') ?? 0),
    published_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('live_updates').insert(payload)
  if (error) throw new Error(error.message)
  revalidateNews()
  revalidatePath('/admin/live-news')
}

export async function moderateComment(formData: FormData) {
  const supabase = await requireConfigured()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? 'pending') as CommentStatus
  const { error } = await supabase.from('comments').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/comments')
}

export async function deleteComment(formData: FormData) {
  const supabase = await requireConfigured()
  const id = String(formData.get('id') ?? '')
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/comments')
  revalidatePath('/article/[slug]', 'page')
}

export async function saveMediaRecord(formData: FormData) {
  const supabase = await requireConfigured()
  const { error } = await supabase.from('media').insert({
    name: String(formData.get('name') ?? ''),
    url: String(formData.get('url') ?? ''),
    type: String(formData.get('type') ?? 'image'),
    folder: String(formData.get('folder') ?? ''),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/media')
}

export async function upsertUserRole(formData: FormData) {
  const supabase = await requireConfigured()
  const id = String(formData.get('id') ?? '')
  const { error } = await supabase
    .from('users')
    .update({ role: String(formData.get('role') ?? 'journalist') as UserRole })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function saveSetting(formData: FormData) {
  const supabase = await requireConfigured()
  const { error } = await supabase.from('settings').upsert({
    key: String(formData.get('key') ?? ''),
    value: String(formData.get('value') ?? ''),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}
