import 'server-only'

import { type Article, type AuthorProfile, type Category, type LiveItem, NAV_LINKS, sampleAuthors, podcastEpisodes } from '@/lib/data'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { fetchExternalNews, type ExternalNewsItem } from '@/lib/external-news'
import { fetchWireFromRssFeeds } from '@/lib/wire-rss'
import { externalArticleSlug, matchesWireSlug, normalizeWireUrl } from '@/lib/wire-slug'
import {
  articleMatchesCategorySlug,
  categoryLabelFromSlug,
  getCategoryFetchConfig,
} from '@/lib/category-external'
import { getCachedSyndicatedArticles, getSyndicatedArticleFromCache, getSyndicatedSlugIndexEntry, articleFromSlugIndex, persistSyndicatedArticles } from '@/lib/syndicated-cache'
import { cleanWireExcerpt, isGarbageArticleContent, isPaidPlanPlaceholder, isSyndicatedContentComplete, sanitizeArticleBody } from '@/lib/syndicated-content'
import { enrichSyndicatedArticle, enrichSyndicatedArticleFast } from '@/lib/syndicated-enrich'
import { ensureArticleImage, hasRealImage } from '@/lib/feed-images'
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

export { externalArticleSlug } from '@/lib/wire-slug'

function mapExternalNewsItem(row: ExternalNewsItem, forcedCategory?: Category): Article {
  const title = row.title || 'Untitled story'
  const publishedAt = row.publishedAt || new Date().toISOString()
  const sourceName = row.source || 'Original publisher'
  const canonicalUrl = normalizeWireUrl(row.url)
  const rawBody = isPaidPlanPlaceholder(row.content) ? row.description || '' : row.content || row.description || ''
  const cleaned = cleanWireExcerpt(rawBody) || cleanWireExcerpt(row.description) || ''
  const body = isSyndicatedContentComplete(cleaned) ? cleaned : ''
  return {
    id: canonicalUrl,
    slug: externalArticleSlug(canonicalUrl),
    title,
    dek: row.description || body.split(/\n{2,}/)[0]?.slice(0, 280) || title,
    content: body,
    category: forcedCategory ?? toCategory(row.category ?? undefined),
    image: row.imageUrl || '',
    imageCredit: sourceName,
    author: sourceName,
    authorRole: 'Syndicated source',
    readingTime: Math.max(3, Math.ceil(body.split(/\s+/).filter(Boolean).length / 220)),
    publishedAt,
    region: row.country || 'Global',
    readers: 0,
    engagement: 0,
    sentiment: 'neutral',
    trendDelta: 12,
    externalUrl: canonicalUrl,
  }
}

function dedupeArticles(articles: Article[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    if (seen.has(article.slug)) return false
    seen.add(article.slug)
    return Boolean(article.title)
  })
}

async function fetchExternalNewsForCategorySlug(slug: string, limit = 50): Promise<Article[]> {
  const config = getCategoryFetchConfig(slug)
  const label = categoryLabelFromSlug(slug)
  if (!config || !label) return []

  const attempts: ExternalNewsItem[] = []

  const targeted = await fetchExternalNews({
    provider: 'all',
    category: config.newsdataCategory,
    country: config.newsdataCountry,
    topic: config.gnewsTopic,
    mediastackCategory: config.mediastackCategory,
    query: config.searchTerms[0],
  })
  attempts.push(...targeted)

  for (const term of config.searchTerms.slice(0, 2)) {
    if (attempts.length >= limit) break
    const searched = await fetchExternalNews({ provider: 'all', query: term })
    attempts.push(...searched)
  }

  const cached = await getCachedSyndicatedArticles(300)
  const cachedMatches = cached.filter((article) => articleMatchesCategorySlug(slug, article))

  const seen = new Set<string>()
  const merged: Article[] = []

  for (const item of attempts) {
    if (!item.url || seen.has(item.url)) continue
    seen.add(item.url)
    merged.push(mapExternalNewsItem(item, label))
    if (merged.length >= limit) break
  }

  for (const article of cachedMatches) {
    if (seen.has(article.slug)) continue
    seen.add(article.slug)
    merged.push({ ...article, category: label })
    if (merged.length >= limit) break
  }

  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  await persistSyndicatedArticles(merged)
  return merged.slice(0, limit)
}

export async function fetchAllExternalArticles(limit = 500): Promise<Article[]> {
  const results = await fetchExternalNews({ provider: 'all' })
  const seen = new Set<string>()
  const articles: Article[] = []

  for (const item of results) {
    if (!item.title || !item.url || seen.has(item.url)) continue
    seen.add(item.url)
    articles.push(mapExternalNewsItem(item))
    if (articles.length >= limit) break
  }

  await persistSyndicatedArticles(articles)
  return articles
}

export async function getLatestWireArticles(limit = 120): Promise<Article[]> {
  let fresh: Article[] = []

  try {
    const results = await fetchExternalNews({ provider: 'all' })
    const seen = new Set<string>()

    for (const item of results) {
      if (!item.title || !item.url || seen.has(item.url)) continue
      seen.add(item.url)
      fresh.push(mapExternalNewsItem(item))
    }

    if (fresh.length) {
      await persistSyndicatedArticles(fresh)
    }
  } catch {
    // Fall back to the persisted wire cache below.
  }

  const cached = await getCachedSyndicatedArticles(Math.max(limit, 160))
  let merged = dedupeArticles([...fresh, ...cached])
  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  if (!merged.length) {
    const rssItems = await fetchWireFromRssFeeds(limit)
    if (rssItems.length) {
      const rssArticles = rssItems.map((item) => mapExternalNewsItem(item))
      await persistSyndicatedArticles(rssArticles)
      merged = dedupeArticles(rssArticles)
    }
  }

  return merged.slice(0, limit)
}

export async function getRelatedArticles(currentSlug: string, category: Category, limit = 3): Promise<Article[]> {
  const [wire, own] = await Promise.all([getLatestWireArticles(40), getPublishedArticles(12)])
  const pool = dedupeArticles([...wire, ...own]).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  const sameCategory = pool.filter((item) => item.slug !== currentSlug && item.category === category)
  const other = pool.filter((item) => item.slug !== currentSlug && item.category !== category)

  return [...sameCategory, ...other].slice(0, limit)
}

export async function getExternalNewsItems(query?: string, limit = 12): Promise<Article[]> {
  const slug = query ? slugifyCategory(query) : ''
  if (slug && getCategoryFetchConfig(slug)) {
    return fetchExternalNewsForCategorySlug(slug, limit)
  }

  const results = await fetchExternalNews({ provider: 'all', query })
  const articles = results
    .filter((item) => item.title)
    .slice(0, limit)
    .map((item) => mapExternalNewsItem(item))

  await persistSyndicatedArticles(articles)
  return articles
}

async function searchFreshWireForSlug(slug: string): Promise<Article | undefined> {
  const candidates: Article[] = []

  try {
    const rssItems = await fetchWireFromRssFeeds(120)
    candidates.push(...rssItems.map((item) => mapExternalNewsItem(item)))
  } catch {
    // RSS fallback is best-effort.
  }

  try {
    const results = await fetchExternalNews({ provider: 'all' })
    for (const item of results) {
      if (!item.url || !item.title) continue
      candidates.push(mapExternalNewsItem(item))
    }
  } catch {
    // API fallback is best-effort.
  }

  return candidates.find((article) => matchesWireSlug(article.slug, slug, article.externalUrl))
}

async function findExternalArticleBySlug(slug: string) {
  if (!slug.startsWith('ext-')) return undefined

  const direct = await getSyndicatedArticleFromCache(slug)
  if (direct) return direct

  const cached = await getCachedSyndicatedArticles(500)
  const fromCache = cached.find((article) => matchesWireSlug(article.slug, slug, article.externalUrl))
  if (fromCache) return fromCache

  const indexEntry = await getSyndicatedSlugIndexEntry(slug)
  if (indexEntry) {
    return articleFromSlugIndex(indexEntry)
  }

  const fresh = await searchFreshWireForSlug(slug)
  if (fresh) {
    await persistSyndicatedArticles([fresh])
    return fresh
  }

  return undefined
}

function hasGoodWireBody(content?: string | null) {
  return Boolean(content && isSyndicatedContentComplete(content) && !isGarbageArticleContent(content))
}

async function resolveSyndicatedArticle(article: Article) {
  if (!article.externalUrl) return article

  if (hasGoodWireBody(article.content)) {
    if (hasRealImage(article.image)) return article
    return Promise.race([
      ensureArticleImage(article),
      new Promise<Article>((resolve) => setTimeout(() => resolve(article), 1500)),
    ])
  }

  const enriched = await enrichSyndicatedArticleFast(article, 4000)
  const cleaned = {
    ...enriched,
    content: sanitizeArticleBody(enriched.content) || '',
  }

  if (!hasGoodWireBody(cleaned.content)) {
    void enrichSyndicatedArticle(article).then((full) => persistSyndicatedArticles([full], hasGoodWireBody(full.content)))
  }

  if (hasRealImage(cleaned.image)) return cleaned

  const withImage = await Promise.race([
    ensureArticleImage(cleaned),
    new Promise<Article>((resolve) => setTimeout(() => resolve(cleaned), 1500)),
  ])

  if (withImage.image !== cleaned.image && hasRealImage(withImage.image)) {
    await persistSyndicatedArticles([withImage])
  }

  return withImage
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
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
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
    updatedAt: row.updated_at ?? row.publish_date ?? row.created_at,
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

export async function getWireArticleBySlug(slug: string) {
  return findExternalArticleBySlug(slug)
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  if (slug.startsWith('ext-')) {
    const article = await findExternalArticleBySlug(slug)
    if (!article) return undefined
    try {
      return await resolveSyndicatedArticle(article)
    } catch {
      return article
    }
  }

  if (hasSupabaseAdminConfig()) {
    const supabase = createSupabaseAdminClient()

    if (supabaseNewsTable !== 'articles') {
      const { data, error } = await supabase.from(supabaseNewsTable).select('*').limit(200)
      if (!error && data?.length) {
        const match = data
          .map((row) => mapFlexibleArticle(row as Record<string, any>))
          .find((article) => article.slug === slug || article.id === slug)
        if (match) return match
      }
    } else {
      const { data, error } = await supabase
        .from('articles')
        .select('*, authors(*), categories(*)')
        .eq('slug', slug)
        .in('status', ['published', 'breaking'])
        .maybeSingle()

      if (!error && data) return mapArticle(data as ArticleRow)
    }
  }

  return findExternalArticleBySlug(slug)
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
  let ownArticles: Article[] = []

  if (hasSupabaseAdminConfig()) {
    const supabase = createSupabaseAdminClient()

    if (supabaseNewsTable !== 'articles') {
      const { data } = await supabase.from(supabaseNewsTable).select('*').limit(200)
      if (data?.length) {
        ownArticles = data
          .map((row) => mapFlexibleArticle(row as Record<string, any>))
          .filter((article) => slugifyCategory(article.category) === slug)
      }
    } else {
      const { data } = await supabase
        .from('articles')
        .select('*, authors(*), categories!inner(*)')
        .eq('categories.slug', slug)
        .in('status', ['published', 'breaking'])
        .lte('publish_date', new Date().toISOString())
        .order('publish_date', { ascending: false, nullsFirst: false })
        .limit(limit)

      if (data?.length) {
        ownArticles = data.map((row) => mapArticle(row as ArticleRow))
      }
    }
  }

  if (ownArticles.length >= limit) {
    return ownArticles.slice(0, limit)
  }

  const cached = await getCachedSyndicatedArticles(200)
  const cachedMatches = cached.filter((article) => articleMatchesCategorySlug(slug, article))
  const merged = dedupeArticles([...ownArticles, ...cachedMatches])

  if (merged.length >= limit) {
    return merged.slice(0, limit)
  }

  const external = await fetchExternalNewsForCategorySlug(slug, limit - merged.length)
  return dedupeArticles([...merged, ...external]).slice(0, limit)
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

export async function getAuthorDirectory(): Promise<AuthorProfile[]> {
  if (!hasSupabaseAdminConfig()) return sampleAuthors
  if (supabaseNewsTable !== 'articles') return sampleAuthors

  const supabase = createSupabaseAdminClient()
  const { data: authors, error } = await supabase.from('authors').select('*')
  if (error || !authors?.length) return sampleAuthors

  const articlesResult = await supabase.from('articles').select('id, author_id, view_count, comment_count')
  const articleRows = articlesResult.data ?? []
  const authorStats = authors.reduce<Record<string, { articles: number; views: number; comments: number }>>((acc, author) => {
    acc[author.id] = { articles: 0, views: 0, comments: 0 }
    return acc
  }, {})

  for (const row of articleRows) {
    const authorId = String((row as any).author_id ?? '')
    if (!authorStats[authorId]) continue
    authorStats[authorId].articles += 1
    authorStats[authorId].views += Number((row as any).view_count ?? 0)
    authorStats[authorId].comments += Number((row as any).comment_count ?? 0)
  }

  return authors.map((author) => ({
    id: author.id,
    name: author.name,
    role: author.role ?? 'Author',
    expertise: typeof author.expertise === 'string' ? author.expertise.split(',').map((item: string) => item.trim()).filter(Boolean) : Array.isArray(author.expertise) ? author.expertise : [],
    bio: author.bio ?? '',
    profileImage: author.profile_image ?? '/placeholder.jpg',
    socialLinks: {
      x: author.social_links?.x ?? '',
      linkedin: author.social_links?.linkedin ?? '',
      website: author.social_links?.website ?? '',
    },
    articles: authorStats[author.id]?.articles ?? 0,
    views: authorStats[author.id]?.views ?? 0,
    comments: authorStats[author.id]?.comments ?? 0,
  }))
}

export function getPodcastEpisodes() {
  return podcastEpisodes
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
