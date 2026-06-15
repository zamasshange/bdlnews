import 'server-only'

import type { Article } from '@/lib/data'
import { categoryFallbackImage, hasRealImage } from '@/lib/feed-images'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const SETTINGS_KEY = 'syndicated_articles'
const MAX_CACHED = 500

export type SyndicatedRecord = {
  slug: string
  url: string
  title: string
  description: string
  fullContent?: string
  imageUrl: string | null
  imageCredit?: string
  source: string
  publishedAt: string | null
  category: string | null
  country: string | null
  cachedAt: string
  enrichedAt?: string
}

function recordToArticle(record: SyndicatedRecord): Article {
  const content = record.fullContent || record.description
  return {
    id: record.url,
    slug: record.slug,
    title: record.title,
    dek: record.description,
    content,
    category: (record.category as Article['category']) || 'World',
    image: record.imageUrl || categoryFallbackImage((record.category as Article['category']) || 'World', record.slug),
    imageCredit: record.imageCredit || record.source,
    author: record.source || 'Original publisher',
    authorRole: 'Syndicated source',
    readingTime: Math.max(3, Math.ceil(content.split(/\s+/).filter(Boolean).length / 220)),
    publishedAt: record.publishedAt || record.cachedAt,
    region: record.country || 'Global',
    readers: 0,
    engagement: 0,
    sentiment: 'neutral',
    trendDelta: 12,
    externalUrl: record.url,
  }
}

function articleToRecord(article: Article, enriched = false): SyndicatedRecord {
  return {
    slug: article.slug,
    url: article.externalUrl ?? article.id ?? article.slug,
    title: article.title,
    description: article.dek || article.content?.slice(0, 280) || '',
    fullContent: article.content,
    imageUrl: article.image?.startsWith('http') ? article.image : null,
    imageCredit: article.imageCredit,
    source: article.author,
    publishedAt: article.publishedAt,
    category: article.category,
    country: article.region !== 'Global' ? article.region : null,
    cachedAt: new Date().toISOString(),
    enrichedAt: enriched ? new Date().toISOString() : undefined,
  }
}

let memoryCache: Record<string, SyndicatedRecord> | null = null
let memoryCacheAt = 0
const MEMORY_CACHE_MS = 60_000

async function readCache(): Promise<Record<string, SyndicatedRecord>> {
  if (memoryCache && Date.now() - memoryCacheAt < MEMORY_CACHE_MS) {
    return memoryCache
  }

  if (!hasSupabaseAdminConfig()) return {}

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
    if (error || !data?.value || typeof data.value !== 'object' || Array.isArray(data.value)) {
      memoryCache = {}
      memoryCacheAt = Date.now()
      return memoryCache
    }
    memoryCache = data.value as Record<string, SyndicatedRecord>
    memoryCacheAt = Date.now()
    return memoryCache
  } catch {
    return memoryCache ?? {}
  }
}

export async function persistSyndicatedArticles(articles: Article[], enriched = false) {
  const wireArticles = articles.filter((article) => article.externalUrl)
  if (!wireArticles.length || !hasSupabaseAdminConfig()) return

  const existing = await readCache()
  const next = { ...existing }

  for (const article of wireArticles) {
    const previous = existing[article.slug]
    next[article.slug] = {
      ...articleToRecord(article, enriched),
      enrichedAt: enriched ? new Date().toISOString() : previous?.enrichedAt,
    }
  }

  const sorted = Object.values(next).sort(
    (a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime(),
  )
  const trimmed = sorted.slice(0, MAX_CACHED).reduce<Record<string, SyndicatedRecord>>((acc, record) => {
    acc[record.slug] = record
    return acc
  }, {})

  try {
    const supabase = createSupabaseAdminClient()
    await supabase.from('settings').upsert({
      key: SETTINGS_KEY,
      value: trimmed,
      updated_at: new Date().toISOString(),
    })
    memoryCache = trimmed
    memoryCacheAt = Date.now()
  } catch {
    // Cache is best-effort; live feed lookup still works.
  }
}

export async function getCachedSyndicatedArticles(limit = 50): Promise<Article[]> {
  const cache = await readCache()
  const records = Object.values(cache)
  records.sort((a, b) => {
    const aTime = new Date(a.publishedAt || a.cachedAt).getTime()
    const bTime = new Date(b.publishedAt || b.cachedAt).getTime()
    return bTime - aTime
  })
  return records.slice(0, limit).map(recordToArticle)
}

export async function getSyndicatedArticleFromCache(slug: string): Promise<Article | undefined> {
  const cache = await readCache()
  const record = cache[slug]
  if (!record) return undefined
  return recordToArticle(record)
}

export async function getSyndicatedRecord(slug: string): Promise<SyndicatedRecord | undefined> {
  const cache = await readCache()
  return cache[slug]
}

export async function getSyndicatedArticleByUrl(url: string): Promise<Article | undefined> {
  const cache = await readCache()
  const record = Object.values(cache).find((item) => item.url === url)
  if (!record) return undefined
  return recordToArticle(record)
}
