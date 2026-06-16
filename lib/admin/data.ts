import 'server-only'

import { NAV_LINKS } from '@/lib/data'
import { withTimeout } from '@/lib/admin/query'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { getCachedSyndicatedArticles } from '@/lib/syndicated-cache'

export type DashboardOverview = {
  stats: Awaited<ReturnType<typeof getDashboardStats>>
  editorial: Awaited<ReturnType<typeof getEditorialAnalytics>>
  publishedArticles: AdminArticleRow[]
  recentDrafts: AdminArticleRow[]
  pendingComments: AdminCommentRow[]
  liveUpdates: AdminLiveRow[]
  wireCount: number
}

export type AdminArticleRow = {
  id: string
  headline: string
  slug: string
  status: string
  category?: string
  updated_at: string
  publish_date?: string | null
  view_count?: number
}

export type AdminCommentRow = {
  id: string
  author_name: string
  body: string
  status: string
  created_at: string
  articles?: { headline?: string | null } | null
}

export type AdminLiveRow = {
  id: string
  headline: string
  status: string
  published_at: string
  categories?: { name?: string | null } | null
}

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

export async function getEditorialAnalytics() {
  const empty = {
    views30d: 0,
    pendingComments: 0,
    approvedComments: 0,
    topArticles: [] as { title: string; slug: string; views: number }[],
    topSources: [] as { source: string; views: number }[],
    devices: [] as { device: string; views: number }[],
  }

  if (!hasSupabaseAdminConfig()) return empty

  const supabase = createSupabaseAdminClient()
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)

  const [views30dRes, commentsRes, viewsRes, articlesRes] = await Promise.all([
    safeQueryResponse(
      supabase.from('article_views').select('id', { count: 'exact', head: true }).gte('viewed_at', since30.toISOString()),
    ),
    safeQueryResponse(supabase.from('comments').select('id, status')),
    safeQueryResponse(
      supabase
        .from('article_views')
        .select('article_id, source, device_type')
        .gte('viewed_at', since30.toISOString())
        .limit(2000),
    ),
    safeQueryResponse(
      supabaseNewsTable === 'articles'
        ? supabase.from('articles').select('id, headline, slug, view_count').order('view_count', { ascending: false }).limit(8)
        : supabase.from(supabaseNewsTable).select('*').limit(200),
    ),
  ])

  const comments = commentsRes?.data ?? []
  const pendingComments = comments.filter((row: { status?: string }) => row.status !== 'approved').length
  const approvedComments = comments.filter((row: { status?: string }) => row.status === 'approved').length

  const viewRows: Array<{ article_id?: string; source?: string | null; device_type?: string | null }> =
    viewsRes?.data ?? []

  const articleCounts = new Map<string, number>()
  const sourceCounts = new Map<string, number>()
  const deviceCounts = new Map<string, number>()

  for (const row of viewRows) {
    const articleId = String(row.article_id ?? '')
    if (articleId) articleCounts.set(articleId, (articleCounts.get(articleId) ?? 0) + 1)
    const source = row.source?.trim() || 'Direct / unknown'
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1)
    const device = row.device_type?.trim() || 'unknown'
    deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1)
  }

  const articleRows = (articlesRes?.data ?? []).map((row: Record<string, unknown>) =>
    supabaseNewsTable === 'articles' ? row : normalizeAdminArticle(row),
  )

  const titleById = new Map<string, { title: string; slug: string; views: number }>()
  for (const row of articleRows) {
    const id = String(row.id ?? '')
    if (!id) continue
    titleById.set(id, {
      title: String(row.headline ?? row.title ?? 'Untitled'),
      slug: String(row.slug ?? id),
      views: Number(row.view_count ?? articleCounts.get(id) ?? 0),
    })
  }

  for (const [articleId, views] of articleCounts.entries()) {
    if (!titleById.has(articleId)) {
      titleById.set(articleId, { title: `Article ${articleId}`, slug: articleId, views })
    } else {
      const current = titleById.get(articleId)!
      titleById.set(articleId, { ...current, views: Math.max(current.views, views) })
    }
  }

  const topArticles = [...titleById.values()].sort((a, b) => b.views - a.views).slice(0, 6)
  const topSources = [...sourceCounts.entries()]
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
  const devices = [...deviceCounts.entries()]
    .map(([device, views]) => ({ device, views }))
    .sort((a, b) => b.views - a.views)

  return {
    views30d: views30dRes?.count ?? 0,
    pendingComments,
    approvedComments,
    topArticles,
    topSources,
    devices,
  }
}

function mapArticleRow(row: Record<string, any>): AdminArticleRow {
  const normalized = supabaseNewsTable === 'articles' ? row : normalizeAdminArticle(row)
  return {
    id: String(normalized.id ?? normalized.slug),
    headline: String(normalized.headline ?? normalized.title ?? 'Untitled'),
    slug: String(normalized.slug ?? normalized.id ?? ''),
    status: String(normalized.status ?? 'draft'),
    category: String(normalized.categories?.name ?? normalized.category ?? 'Uncategorized'),
    updated_at: String(normalized.updated_at ?? normalized.created_at ?? new Date().toISOString()),
    publish_date: normalized.publish_date ?? null,
    view_count: Number(normalized.view_count ?? 0),
  }
}

export async function getDashboardOverviewLight(): Promise<Pick<DashboardOverview, 'stats' | 'publishedArticles' | 'wireCount'>> {
  const emptyStats = {
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

  if (!hasSupabaseAdminConfig()) {
    return { stats: emptyStats, publishedArticles: [], wireCount: 0 }
  }

  return withTimeout(loadDashboardOverviewLight(), 4000, {
    stats: emptyStats,
    publishedArticles: [],
    wireCount: 0,
  })
}

async function loadDashboardOverviewLight(): Promise<Pick<DashboardOverview, 'stats' | 'publishedArticles' | 'wireCount'>> {
  const emptyStats = {
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

  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable

  const [publishedRes, totalRes, draftRes] = await Promise.all([
    safeQueryResponse(
      table === 'articles'
        ? supabase
            .from('articles')
            .select('*, categories(name)')
            .in('status', ['published', 'breaking'])
            .order('publish_date', { ascending: false })
            .limit(8)
        : supabase.from(table).select('*').order('created_at', { ascending: false }).limit(8),
    ),
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true })),
    safeQueryResponse(supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'draft')),
  ])

  const publishedArticles = ((publishedRes?.data ?? []) as Record<string, any>[]).map(mapArticleRow)

  return {
    stats: {
      ...emptyStats,
      totalArticles: totalRes?.count ?? publishedArticles.length,
      publishedArticles: publishedArticles.length,
      draftArticles: draftRes?.count ?? 0,
    },
    publishedArticles,
    wireCount: 0,
  }
}

export async function getAdminCategories() {
  if (!hasSupabaseAdminConfig()) {
    const fallbackCategories = NAV_LINKS.filter((name) => name !== 'Home').map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
    }))
    return fallbackCategories
  }

  return withTimeout(loadAdminCategories(), 3000, NAV_LINKS.filter((name) => name !== 'Home').map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
  })))
}

async function loadAdminCategories() {
  const supabase = createSupabaseAdminClient()
  const { data } = await safeQueryResponse(supabase.from('categories').select('*').order('name'))
  if (data?.length) return data

  return NAV_LINKS.filter((name) => name !== 'Home').map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
  }))
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [stats, editorial, collections, wireArticles] = await Promise.all([
    getDashboardStats(),
    getEditorialAnalytics(),
    getAdminCollections(),
    getCachedSyndicatedArticles(500),
  ])

  const articles = (collections.articles as Record<string, any>[]).map(mapArticleRow)
  const publishedArticles = articles
    .filter((article) => article.status === 'published' || article.status === 'breaking')
    .sort((a, b) => new Date(b.publish_date ?? b.updated_at).getTime() - new Date(a.publish_date ?? a.updated_at).getTime())
    .slice(0, 8)

  const recentDrafts = articles
    .filter((article) => article.status === 'draft' || article.status === 'scheduled')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const pendingComments = (collections.comments as AdminCommentRow[])
    .filter((comment) => comment.status !== 'approved')
    .slice(0, 5)

  const liveUpdates = (collections.liveUpdates as AdminLiveRow[]).slice(0, 5)

  return {
    stats,
    editorial,
    publishedArticles,
    recentDrafts,
    pendingComments,
    liveUpdates,
    wireCount: wireArticles.length,
  }
}

export async function getAdminArticlesList() {
  if (!hasSupabaseAdminConfig()) return []

  return withTimeout(loadAdminArticlesList(), 5000, [])
}

async function loadAdminArticlesList() {
  const table = supabaseNewsTable
  const supabase = createSupabaseAdminClient()
  const { data } = await safeQueryResponse(
    table === 'articles'
      ? supabase.from('articles').select('*, authors(name), categories(name)').order('updated_at', { ascending: false }).limit(100)
      : supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100),
  )

  return table === 'articles' ? data ?? [] : (data ?? []).map(normalizeAdminArticle)
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
