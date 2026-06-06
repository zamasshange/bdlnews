import 'server-only'

import { type Article, type Category, type LiveItem, NAV_LINKS } from '@/lib/data'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { fetchExternalNews, type ExternalNewsItem } from '@/lib/external-news'
import type { ArticleRow } from '@/lib/supabase/types'

const categoryFallback: Category = 'World'

function toCategory(value?: string | null): Category {
  return (value as Category | undefined) ?? categoryFallback
}

function slugifyCategory(value?: string | null) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function mapExternalNewsItem(row: ExternalNewsItem): Article {
  const title = row.title || 'Untitled story'
  const publishedAt = row.publishedAt || new Date().toISOString()
  return {
    id: row.url,
    slug: slugifyCategory(title),
    title,
    dek: row.description || '',
    content: row.description || '',
    category: toCategory(row.category ?? row.source ?? undefined),
    image: row.imageUrl || '/placeholder.jpg',
    author: row.source || 'BDL Newsroom',
    authorRole: 'External feed',
    readingTime: Math.max(3, Math.ceil((row.description ?? '').split(/\s+/).filter(Boolean).length / 220)),
    publishedAt,
    region: row.country || 'Global',
    readers: 0,
    engagement: 0,
    sentiment: 'neutral',
    trendDelta: 12,
    externalUrl: row.url,
  }
}

export async function getExternalNewsItems(query?: string, limit = 12): Promise<Article[]> {
  const results = await fetchExternalNews({ provider: 'all', query })
  return results
    .filter((item) => item.title)
    .slice(0, limit)
    .map(mapExternalNewsItem)
}

function estimateReadingTime(content?: string | null) {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(3, Math.ceil(words / 220))
}

function readFirst(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return ''
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim())
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function mapFlexibleArticle(row: Record<string, any>): Article {
  const title = readFirst(row, ['headline', 'title', 'name'])
  const content = readFirst(row, ['content', 'body', 'article', 'full_content', 'description'])
  const imageCredit = readFirst(row, ['image_credit', 'photo_credit', 'credit'])
  const gallery = parseStringArray(row.gallery_images ?? row.images ?? row.gallery)
  const publishedAt =
    readFirst(row, ['publish_date', 'published_at', 'pubDate', 'pub_date', 'created_at', 'date']) ||
    new Date().toISOString()

  return {
    id: readFirst(row, ['id', 'uuid']) || undefined,
    slug: readFirst(row, ['slug']) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title,
    dek: readFirst(row, ['subtitle', 'dek', 'description', 'summary']),
    content,
    gallery,
    imageCredit,
    category: toCategory(readFirst(row, ['category', 'category_name'])),
    image: readFirst(row, ['featured_image', 'image', 'image_url', 'urlToImage', 'thumbnail']) || '/placeholder.jpg',
    author: readFirst(row, ['author', 'author_name', 'source_name', 'source']) || 'BDL Newsroom',
    authorRole: readFirst(row, ['author_role']) || 'Newsroom',
    readingTime: estimateReadingTime(content),
    publishedAt,
    region: readFirst(row, ['region', 'country']) || 'Global',
    readers: Number(row.readers ?? row.views ?? 0),
    engagement: Number(row.engagement ?? 82),
    sentiment: row.sentiment === 'positive' || row.sentiment === 'controversial' ? row.sentiment : 'neutral',
    trendDelta: Number(row.trend_delta ?? row.trendDelta ?? 12),
  }
}

export function mapArticle(row: ArticleRow): Article {
  const author = row.authors?.name ?? 'BDL Newsroom'
  const viewCount = Number(row.view_count ?? 0)
  const commentCount = Number(row.comment_count ?? 0)
  const shareCount = Number(row.share_count ?? 0)
  const content = (row as Record<string, any>).content ?? (row as Record<string, any>).body ?? (row as Record<string, any>).article ?? ''
  const gallery = parseStringArray((row as Record<string, any>).gallery_images ?? (row as Record<string, any>).gallery)
  const imageCredit = (row as Record<string, any>).image_credit ?? (row as Record<string, any>).photo_credit ?? ''
  return {
    id: row.id,
    slug: row.slug,
    title: row.headline,
    dek: row.subtitle ?? row.seo_description ?? (row as Record<string, any>).description ?? '',
    content,
    gallery,
    imageCredit,
    category: toCategory(row.categories?.name),
    categorySlug: row.categories?.slug,
    image: row.featured_image ?? '/placeholder.jpg',
    author,
    authorId: row.author_id ?? undefined,
    authorRole: row.authors?.role ?? 'Newsroom',
    authorBio: row.authors?.bio ?? undefined,
    tags: row.seo_keywords ?? [],
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    readingTime: estimateReadingTime(content),
    publishedAt: row.publish_date ?? row.created_at,
    region: 'Global',
    readers: viewCount,
    comments: commentCount,
    shares: shareCount,
    engagement: Math.min(100, Math.round(viewCount / 20 + commentCount * 3 + shareCount * 2)),
    sentiment: row.status === 'breaking' ? 'controversial' : 'neutral',
    trendDelta: row.status === 'breaking' ? 48 : Math.min(99, Math.round(viewCount / 50 + commentCount * 4 + shareCount * 3)),
  }
}

export async function getPublishedArticles(limit = 50): Promise<Article[]> {
  if (!hasSupabaseAdminConfig()) return []

  const supabase = createSupabaseAdminClient()

  if (supabaseNewsTable !== 'articles') {
    const { data, error } = await supabase.from(supabaseNewsTable).select('*').limit(limit)
    if (error || !data?.length) return []
    return data
      .map((row) => mapFlexibleArticle(row as Record<string, any>))
      .filter((article) => article.title)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  }

  const { data, error } = await supabase
    .from('articles')
    .select('*, authors(*), categories(*)')
    .in('status', ['published', 'breaking'])
    .lte('publish_date', new Date().toISOString())
    .order('publish_date', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error || !data?.length) return []
  return data.map((row) => mapArticle(row as ArticleRow))
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  if (!hasSupabaseAdminConfig()) return undefined

  const supabase = createSupabaseAdminClient()

  if (supabaseNewsTable !== 'articles') {
    const { data, error } = await supabase.from(supabaseNewsTable).select('*').limit(200)
    if (error || !data?.length) return undefined
    return data
      .map((row) => mapFlexibleArticle(row as Record<string, any>))
      .find((article) => article.slug === slug || article.id === slug)
  }

  const { data, error } = await supabase
    .from('articles')
    .select('*, authors(*), categories(*)')
    .eq('slug', slug)
    .in('status', ['published', 'breaking'])
    .maybeSingle()

  if (error || !data) return undefined
  return mapArticle(data as ArticleRow)
}

export async function getLiveUpdates(limit = 20): Promise<LiveItem[]> {
  if (!hasSupabaseAdminConfig()) return []

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('live_updates')
    .select('*, categories(name)')
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return []
  return data.map((item) => ({
    id: item.id,
    time: new Date(item.published_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    category: toCategory((item.categories as { name?: string } | null)?.name),
    headline: item.headline,
    status: item.status.toUpperCase() as LiveItem['status'],
  }))
}

export async function getCategoryBySlug(slug: string) {
  if (!hasSupabaseAdminConfig()) return null
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle()
  if (error) return null
  if (!data) {
    const name = NAV_LINKS.find((item) => slugifyCategory(item) === slug)
    return name ? { name, slug } : null
  }
  return data
}

export async function getArticlesByCategorySlug(slug: string, limit = 50): Promise<Article[]> {
  if (!hasSupabaseAdminConfig()) return []
  const supabase = createSupabaseAdminClient()
  if (supabaseNewsTable !== 'articles') {
    const { data, error } = await supabase.from(supabaseNewsTable).select('*').limit(200)
    if (error || !data) return []
    const filtered = data
      .map((row) => mapFlexibleArticle(row as Record<string, any>))
      .filter((article) => slugifyCategory(article.category) === slug)
      .slice(0, limit)
    if (filtered.length) return filtered
    const categoryName = NAV_LINKS.find((item) => slugifyCategory(item) === slug)
    if (categoryName) return getExternalNewsItems(categoryName, limit)
    return []
  }

  const { data, error } = await supabase
    .from('articles')
    .select('*, authors(*), categories!inner(*)')
    .eq('categories.slug', slug)
    .in('status', ['published', 'breaking'])
    .lte('publish_date', new Date().toISOString())
    .order('publish_date', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error || !data) return []
  return data.map((row) => mapArticle(row as ArticleRow))
}

export async function getAuthorProfile(id: string) {
  if (!hasSupabaseAdminConfig()) return null
  if (supabaseNewsTable !== 'articles') return null
  const supabase = createSupabaseAdminClient()
  const [{ data: author, error }, articles] = await Promise.all([
    supabase.from('authors').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('articles')
      .select('*, authors(*), categories(*)')
      .eq('author_id', id)
      .in('status', ['published', 'breaking'])
      .order('publish_date', { ascending: false, nullsFirst: false }),
  ])
  if (error || !author) return null
  const stories = (articles.data ?? []).map((row) => mapArticle(row as ArticleRow))
  return {
    author,
    articles: stories,
    stats: {
      articles: stories.length,
      views: stories.reduce((sum, article) => sum + article.readers, 0),
      comments: stories.reduce((sum, article) => sum + (article.comments ?? 0), 0),
    },
  }
}

export async function getBreakingTickerItems() {
  const [published, live] = await Promise.all([getPublishedArticles(8), getLiveUpdates(8)])
  const breaking = published
    .filter((article) => article.trendDelta > 30 || article.sentiment === 'controversial')
    .map((article) => article.title)

  return [...live.map((item) => item.headline), ...breaking].slice(0, 8)
}

export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  if (!hasSupabaseAdminConfig()) return []
  const value = query.trim()
  if (!value) return getPublishedArticles(limit)

  const supabase = createSupabaseAdminClient()
  if (supabaseNewsTable !== 'articles') {
    const { data, error } = await supabase.from(supabaseNewsTable).select('*').limit(200)
    if (error || !data) return []
    const needle = value.toLowerCase()
    return data
      .map((row) => mapFlexibleArticle(row as Record<string, any>))
      .filter((article) =>
        [
          article.title,
          article.dek,
          article.content,
          article.category,
          article.author,
          ...(article.tags ?? []),
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle)),
      )
      .slice(0, limit)
  }

  const { data, error } = await supabase
    .from('articles')
    .select('*, authors(*), categories(*)')
    .in('status', ['published', 'breaking'])
    .order('publish_date', { ascending: false, nullsFirst: false })
    .limit(200)

  if (error || !data) return []
  const needle = value.toLowerCase()
  return data
    .map((row) => mapArticle(row as ArticleRow))
    .filter((article) =>
      [
        article.title,
        article.dek,
        article.content,
        article.category,
        article.author,
        ...(article.tags ?? []),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    )
    .slice(0, limit)
}

export async function getTrendingArticles(kind = 'trending', limit = 10): Promise<Article[]> {
  if (!hasSupabaseAdminConfig()) return []
  const supabase = createSupabaseAdminClient()
  if (supabaseNewsTable !== 'articles') {
    const { data, error } = await supabase.from(supabaseNewsTable).select('*').limit(200)
    if (error || !data) return []
    return data
      .map((row) => mapFlexibleArticle(row as Record<string, any>))
      .filter((article) => article.title)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
  }

  const supabaseQuery = supabase
    .from('articles')
    .select('*, authors(*), categories(*)')
    .in('status', ['published', 'breaking'])
    .limit(limit)

  let query = supabaseQuery
  if (kind === 'recent') query = query.order('publish_date', { ascending: false, nullsFirst: false })
  else if (kind === 'discussed') query = query.order('comment_count', { ascending: false })
  else if (kind === 'shared') query = query.order('share_count', { ascending: false })
  else query = query.order('view_count', { ascending: false }).order('comment_count', { ascending: false })

  const { data, error } = await query
  if (error || !data) return []
  return data.map((row) => mapArticle(row as ArticleRow))
}
