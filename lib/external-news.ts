import 'server-only'

export type ExternalNewsProvider = 'newsdata' | 'gnews' | 'mediastack'

export interface ExternalNewsItem {
  provider: ExternalNewsProvider
  title: string
  description: string
  content?: string
  url: string
  imageUrl: string | null
  source: string
  publishedAt: string | null
  category: string | null
  country: string | null
}

export type ExternalNewsQuery = {
  query?: string
  category?: string
  country?: string
  topic?: string
  mediastackCategory?: string
}

function clean(value: unknown) {
  return typeof value === 'string' ? value : ''
}

async function readJson(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`News provider returned ${response.status}`)
  return response.json()
}

export async function fetchNewsDataLatest(options: ExternalNewsQuery = {}): Promise<ExternalNewsItem[]> {
  const key = process.env.NEWSDATA_API_KEY
  if (!key) return []

  const url = new URL('https://newsdata.io/api/1/latest')
  url.searchParams.set('apikey', key)
  url.searchParams.set('language', 'en')
  if (options.query) url.searchParams.set('q', options.query)
  if (options.category) url.searchParams.set('category', options.category)
  if (options.country) url.searchParams.set('country', options.country)

  const payload = await readJson(url.toString())
  return (payload.results ?? []).map((item: any) => ({
    provider: 'newsdata',
    title: clean(item.title),
    description: clean(item.description),
    content: clean(item.content) || clean(item.description),
    url: clean(item.link),
    imageUrl: clean(item.image_url) || null,
    source: clean(item.source_name),
    publishedAt: clean(item.pubDate) || null,
    category: Array.isArray(item.category) ? item.category[0] ?? null : clean(item.category) || null,
    country: Array.isArray(item.country) ? item.country[0] ?? null : clean(item.country) || null,
  }))
}

export async function fetchGNewsLatest(options: ExternalNewsQuery = {}): Promise<ExternalNewsItem[]> {
  const key = process.env.GNEWS_API_KEY
  if (!key) return []

  const useSearch = Boolean(options.query)
  const url = new URL(useSearch ? 'https://gnews.io/api/v4/search' : 'https://gnews.io/api/v4/top-headlines')
  url.searchParams.set('apikey', key)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('max', '20')
  if (options.query) url.searchParams.set('q', options.query)
  if (options.topic) url.searchParams.set('topic', options.topic)

  const payload = await readJson(url.toString())
  return (payload.articles ?? []).map((item: any) => ({
    provider: 'gnews',
    title: clean(item.title),
    description: clean(item.description),
    content: clean(item.content) || clean(item.description),
    url: clean(item.url),
    imageUrl: clean(item.image) || null,
    source: clean(item.source?.name),
    publishedAt: clean(item.publishedAt) || null,
    category: options.topic ?? null,
    country: null,
  }))
}

export async function fetchMediastackLatest(options: ExternalNewsQuery = {}): Promise<ExternalNewsItem[]> {
  const key = process.env.MEDIASTACK_API_KEY
  if (!key) return []

  const url = new URL('http://api.mediastack.com/v1/news')
  url.searchParams.set('access_key', key)
  url.searchParams.set('languages', 'en')
  url.searchParams.set('limit', '25')
  if (options.query) url.searchParams.set('keywords', options.query)
  if (options.mediastackCategory) url.searchParams.set('categories', options.mediastackCategory)
  if (options.country) url.searchParams.set('countries', options.country)

  const payload = await readJson(url.toString())
  return (payload.data ?? []).map((item: any) => ({
    provider: 'mediastack',
    title: clean(item.title),
    description: clean(item.description),
    content: clean(item.description),
    url: clean(item.url),
    imageUrl: clean(item.image) || null,
    source: clean(item.source),
    publishedAt: clean(item.published_at) || null,
    category: clean(item.category) || options.mediastackCategory || null,
    country: clean(item.country) || null,
  }))
}

function dedupeByUrl(items: ExternalNewsItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false
    seen.add(item.url)
    return Boolean(item.title)
  })
}

export async function fetchExternalNews({
  provider = 'newsdata',
  query,
  category,
  country,
  topic,
  mediastackCategory,
}: ExternalNewsQuery & { provider?: ExternalNewsProvider | 'all' }) {
  const options = { query, category, country, topic, mediastackCategory }

  if (provider === 'newsdata') return fetchNewsDataLatest(options)
  if (provider === 'gnews') return fetchGNewsLatest(options)
  if (provider === 'mediastack') return fetchMediastackLatest(options)

  const results = await Promise.allSettled([
    fetchNewsDataLatest(options),
    fetchGNewsLatest(options),
    fetchMediastackLatest(options),
  ])

  return dedupeByUrl(results.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])))
}
