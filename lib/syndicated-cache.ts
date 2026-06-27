import 'server-only'

import type { Article } from '@/lib/data'
import { categoryFallbackImage, hasRealImage } from '@/lib/feed-images'
import { externalArticleSlug, matchesWireSlug, normalizeWireUrl } from '@/lib/wire-slug'
import { isGarbageArticleContent, sanitizeArticleBody } from '@/lib/syndicated-content'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const SETTINGS_KEY = 'syndicated_articles'
const SLUG_INDEX_KEY = 'syndicated_slug_index'
const MAX_CACHED = 2000
const MAX_SLUG_INDEX = 3000

export type SyndicatedSlugIndexEntry = {
  slug: string
  url: string
  title: string
  description: string
  imageUrl: string | null
  source: string
  publishedAt: string | null
  category: string | null
  country: string | null
  cachedAt: string
}

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
  const rawContent = record.fullContent || record.description
  const content = sanitizeArticleBody(rawContent) || (isGarbageArticleContent(rawContent) ? '' : rawContent)
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
  const url = normalizeWireUrl(article.externalUrl ?? article.id ?? article.slug)
  return {
    slug: externalArticleSlug(url),
    url,
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
let memorySlugIndex: Record<string, SyndicatedSlugIndexEntry> | null = null
let memoryCacheAt = 0
const MEMORY_CACHE_MS = 60_000

const runtimeSlugIndex = new Map<string, SyndicatedSlugIndexEntry>()

async function readSlugIndex(): Promise<Record<string, SyndicatedSlugIndexEntry>> {
  if (memorySlugIndex && Date.now() - memoryCacheAt < MEMORY_CACHE_MS) {
    return memorySlugIndex
  }

  if (!hasSupabaseAdminConfig()) {
    return Object.fromEntries(runtimeSlugIndex.entries())
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('settings').select('value').eq('key', SLUG_INDEX_KEY).maybeSingle()
    if (error || !data?.value || typeof data.value !== 'object' || Array.isArray(data.value)) {
      memorySlugIndex = Object.fromEntries(runtimeSlugIndex.entries())
      return memorySlugIndex
    }
    memorySlugIndex = data.value as Record<string, SyndicatedSlugIndexEntry>
    return memorySlugIndex
  } catch {
    return Object.fromEntries(runtimeSlugIndex.entries())
  }
}

async function writeSlugIndex(index: Record<string, SyndicatedSlugIndexEntry>) {
  memorySlugIndex = index
  for (const [slug, entry] of Object.entries(index)) {
    runtimeSlugIndex.set(slug, entry)
  }

  if (!hasSupabaseAdminConfig()) return

  try {
    const supabase = createSupabaseAdminClient()
    await supabase.from('settings').upsert({
      key: SLUG_INDEX_KEY,
      value: index,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Best-effort slug index.
  }
}

function slugIndexEntryFromArticle(article: Article): SyndicatedSlugIndexEntry {
  const url = normalizeWireUrl(article.externalUrl ?? article.id ?? article.slug)
  return {
    slug: externalArticleSlug(url),
    url,
    title: article.title,
    description: article.dek || '',
    imageUrl: hasRealImage(article.image) ? article.image : null,
    source: article.author,
    publishedAt: article.publishedAt,
    category: article.category,
    country: article.region !== 'Global' ? article.region : null,
    cachedAt: new Date().toISOString(),
  }
}

export function articleFromSlugIndex(entry: SyndicatedSlugIndexEntry): Article {
  return {
    id: entry.url,
    slug: entry.slug,
    title: entry.title,
    dek: entry.description,
    content: '',
    category: (entry.category as Article['category']) || 'World',
    image: entry.imageUrl || categoryFallbackImage((entry.category as Article['category']) || 'World', entry.slug),
    imageCredit: entry.source,
    author: entry.source || 'Original publisher',
    authorRole: 'Syndicated source',
    readingTime: 3,
    publishedAt: entry.publishedAt || entry.cachedAt,
    region: entry.country || 'Global',
    readers: 0,
    engagement: 0,
    sentiment: 'neutral',
    trendDelta: 12,
    externalUrl: entry.url,
  }
}

export async function rememberSyndicatedSlugs(articles: Article[]) {
  const wireArticles = articles.filter((article) => article.externalUrl)
  if (!wireArticles.length) return

  const index = await readSlugIndex()
  const next = { ...index }

  for (const article of wireArticles) {
    const entry = slugIndexEntryFromArticle(article)
    next[entry.slug] = entry
    runtimeSlugIndex.set(entry.slug, entry)
  }

  const sorted = Object.values(next).sort(
    (a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime(),
  )
  const trimmed = sorted.slice(0, MAX_SLUG_INDEX).reduce<Record<string, SyndicatedSlugIndexEntry>>((acc, entry) => {
    acc[entry.slug] = entry
    return acc
  }, {})

  await writeSlugIndex(trimmed)
}

export async function getSyndicatedSlugIndexEntry(slug: string) {
  const runtime = runtimeSlugIndex.get(slug)
  if (runtime) return runtime

  for (const entry of runtimeSlugIndex.values()) {
    if (matchesWireSlug(entry.slug, slug, entry.url)) return entry
  }

  const index = await readSlugIndex()
  if (index[slug]) return index[slug]

  for (const entry of Object.values(index)) {
    if (matchesWireSlug(entry.slug, slug, entry.url)) return entry
  }

  return undefined
}

async function readCache(): Promise<Record<string, SyndicatedRecord>> {
  if (memoryCache && Date.now() - memoryCacheAt < MEMORY_CACHE_MS) {
    return memoryCache
  }

  if (!hasSupabaseAdminConfig()) {
    return memoryCache ?? {}
  }

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
  if (!wireArticles.length) return

  await rememberSyndicatedSlugs(wireArticles)

  if (!hasSupabaseAdminConfig()) {
    for (const article of wireArticles) {
      const entry = slugIndexEntryFromArticle(article)
      runtimeSlugIndex.set(entry.slug, entry)
      if (!memoryCache) memoryCache = {}
      memoryCache[entry.slug] = articleToRecord(article, enriched)
    }
    memoryCacheAt = Date.now()
    return
  }

  const existing = await readCache()
  const next = { ...existing }

  for (const article of wireArticles) {
    const slug = externalArticleSlug(normalizeWireUrl(article.externalUrl ?? article.id ?? article.slug))
    const previous = existing[slug]
    next[slug] = {
      ...articleToRecord({ ...article, slug }, enriched),
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
  if (cache[slug]) return recordToArticle(cache[slug])

  for (const record of Object.values(cache)) {
    if (matchesWireSlug(record.slug, slug, record.url)) {
      return recordToArticle(record)
    }
  }

  const indexEntry = await getSyndicatedSlugIndexEntry(slug)
  if (indexEntry) return articleFromSlugIndex(indexEntry)

  return undefined
}

export async function getSyndicatedRecord(slug: string): Promise<SyndicatedRecord | undefined> {
  const cache = await readCache()
  if (cache[slug]) return cache[slug]

  for (const record of Object.values(cache)) {
    if (matchesWireSlug(record.slug, slug, record.url)) {
      return record
    }
  }

  return undefined
}

export async function getSyndicatedArticleByUrl(url: string): Promise<Article | undefined> {
  const canonical = normalizeWireUrl(url)
  const cache = await readCache()
  const record =
    Object.values(cache).find((item) => normalizeWireUrl(item.url) === canonical) ??
    Object.values(cache).find((item) => item.url === url)
  if (!record) return undefined
  return recordToArticle(record)
}
