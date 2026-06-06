import 'server-only'

import { NAV_LINKS } from '@/lib/data'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  if (!hasSupabaseAdminConfig()) {
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      scheduledArticles: 0,
      breakingStories: 0,
      totalAuthors: 0,
      totalViews: 0,
      todayViews: 0,
      activeReaders: 0,
    }
  }

  const supabase = createSupabaseAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const table = supabaseNewsTable
  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    scheduledArticles,
    breakingStories,
    totalAuthors,
    totalViews,
    todayViews,
  ] = await Promise.all([
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true })),
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'draft')),
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'scheduled')),
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'breaking')),
    safeQueryResponse(supabase.from('authors').select('id', { count: 'exact', head: true })),
    safeQueryResponse(supabase.from('article_views').select('id', { count: 'exact', head: true })),
    safeQueryResponse(supabase.from('article_views').select('id', { count: 'exact', head: true }).gte('viewed_at', today.toISOString())),
  ])

  return {
    totalArticles: totalArticles?.count ?? 0,
    publishedArticles: publishedArticles?.count ?? 0,
    draftArticles: draftArticles?.count ?? 0,
    scheduledArticles: scheduledArticles?.count ?? 0,
    breakingStories: breakingStories?.count ?? 0,
    totalAuthors: totalAuthors?.count ?? 0,
    totalViews: totalViews?.count ?? 0,
    todayViews: todayViews?.count ?? 0,
    activeReaders: Math.max(0, Math.round((todayViews?.count ?? 0) / 6)),
  }
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  const message = (error as { message?: string }).message
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    typeof message === 'string' && (message.includes('Could not find the table') || message.includes('does not exist'))
  )
}

function normalizeAdminArticle(row: Record<string, any>) {
  const title = String(row.title ?? row.headline ?? row.name ?? '')
  return {
    ...row,
    id: row.id != null ? String(row.id) : undefined,
    headline: title,
    title,
    slug: String(row.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    subtitle: String(row.subtitle ?? row.dek ?? row.description ?? ''),
    content: String(row.content ?? row.body ?? ''),
    featured_image: String(row.featured_image ?? row.image ?? row.image_url ?? ''),
    category: String(row.category ?? row.category_name ?? row.categories?.name ?? ''),
    category_id: row.category_id ?? row.category_slug ?? row.category ?? null,
    seo_title: String(row.seo_title ?? title),
    seo_description: String(row.seo_description ?? row.description ?? row.subtitle ?? ''),
    seo_keywords: row.seo_keywords ?? row.tags ?? [],
    tags: row.tags ?? row.seo_keywords ?? [],
    categories: row.categories ?? { name: String(row.category ?? row.category_name ?? 'Uncategorized'), slug: row.category_slug ?? row.category },
    authors: row.authors ?? { name: String(row.author ?? row.author_name ?? 'BDL Newsroom') },
    status: String(row.status ?? 'draft'),
    publish_date: row.publish_date ?? row.published_at ?? row.created_at,
  }
}

async function safeQueryResponse<T = any>(query: unknown) {
  const result = (await (query as PromiseLike<{ data: T | null; error: unknown; count?: number | null }>)) as {
    data: T | null
    error: unknown
    count?: number | null
  }
  if (result.error && isMissingTableError(result.error)) {
    return { data: null, error: null, count: null }
  }
  return result
}

export async function getViewsByDay(days = 7) {
  if (!hasSupabaseAdminConfig()) return []
  const supabase = createSupabaseAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  const { data, error } = await safeQueryResponse(
    supabase
      .from('article_views')
      .select('viewed_at')
      .gte('viewed_at', since.toISOString())
      .order('viewed_at', { ascending: true }),
  )

  if (error || !data) return []

  const buckets = new Map<string, number>()
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since)
    date.setDate(since.getDate() + i)
    buckets.set(date.toISOString().slice(0, 10), 0)
  }
  data.forEach((view: { viewed_at?: string | null }) => {
    const key = String(view.viewed_at).slice(0, 10)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  })

  return Array.from(buckets.entries()).map(([day, views]) => ({
    day: new Date(`${day}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }),
    views,
  }))
}

export async function getAdminCollections() {
  if (!hasSupabaseAdminConfig()) {
    return { articles: [], authors: [], categories: [], comments: [], media: [], liveUpdates: [], users: [] }
  }

  const table = supabaseNewsTable
  const supabase = createSupabaseAdminClient()
  const [articles, authors, categories, comments, media, liveUpdates, users] = await Promise.all([
    safeQueryResponse(
      table === 'articles'
        ? supabase.from('articles').select('*, authors(name), categories(name)').order('updated_at', { ascending: false }).limit(100)
        : supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100),
    ),
    safeQueryResponse(supabase.from('authors').select('*').order('name')),
    safeQueryResponse(supabase.from('categories').select('*').order('name')),
    safeQueryResponse(supabase.from('comments').select('*, articles(headline)').order('created_at', { ascending: false }).limit(100)),
    safeQueryResponse(supabase.from('media').select('*').order('created_at', { ascending: false }).limit(100)),
    safeQueryResponse(supabase.from('live_updates').select('*, categories(name)').order('published_at', { ascending: false }).limit(100)),
    safeQueryResponse(supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100)),
  ])

  const fallbackCategories = NAV_LINKS.filter((name) => name !== 'Home').map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
  }))

  return {
    articles: table === 'articles' ? articles?.data ?? [] : (articles?.data ?? []).map(normalizeAdminArticle),
    authors: authors?.data ?? [],
    categories: categories?.data?.length ? categories.data : fallbackCategories,
    comments: comments?.data ?? [],
    media: media?.data ?? [],
    liveUpdates: liveUpdates?.data ?? [],
    users: users?.data ?? [],
  }
}
