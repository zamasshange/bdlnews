import 'server-only'

export type ExternalNewsProvider = 'newsdata' | 'gnews' | 'mediastack'

export interface ExternalNewsItem {
  provider: ExternalNewsProvider
  title: string
  description: string
  url: string
  imageUrl: string | null
  source: string
  publishedAt: string | null
  category: string | null
  country: string | null
}

function clean(value: unknown) {
  return typeof value === 'string' ? value : ''
}

async function readJson(url: string) {
  const response = await fetch(url, { next: { revalidate: 300 } })
  if (!response.ok) throw new Error(`News provider returned ${response.status}`)
  return response.json()
}

export async function fetchNewsDataLatest(query?: string): Promise<ExternalNewsItem[]> {
  const key = process.env.NEWSDATA_API_KEY
  if (!key) return []

  const url = new URL('https://newsdata.io/api/1/latest')
  url.searchParams.set('apikey', key)
  url.searchParams.set('language', 'en')
  if (query) url.searchParams.set('q', query)

  const payload = await readJson(url.toString())
  return (payload.results ?? []).map((item: any) => ({
    provider: 'newsdata',
    title: clean(item.title),
    description: clean(item.description),
    url: clean(item.link),
    imageUrl: clean(item.image_url) || null,
    source: clean(item.source_name),
    publishedAt: clean(item.pubDate) || null,
    category: Array.isArray(item.category) ? item.category[0] ?? null : null,
    country: Array.isArray(item.country) ? item.country[0] ?? null : null,
  }))
}

export async function fetchGNewsLatest(query?: string): Promise<ExternalNewsItem[]> {
  const key = process.env.GNEWS_API_KEY
  if (!key) return []

  const url = new URL(query ? 'https://gnews.io/api/v4/search' : 'https://gnews.io/api/v4/top-headlines')
  url.searchParams.set('apikey', key)
  url.searchParams.set('lang', 'en')
  if (query) url.searchParams.set('q', query)

  const payload = await readJson(url.toString())
  return (payload.articles ?? []).map((item: any) => ({
    provider: 'gnews',
    title: clean(item.title),
    description: clean(item.description),
    url: clean(item.url),
    imageUrl: clean(item.image) || null,
    source: clean(item.source?.name),
    publishedAt: clean(item.publishedAt) || null,
    category: null,
    country: null,
  }))
}

export async function fetchMediastackLatest(query?: string): Promise<ExternalNewsItem[]> {
  const key = process.env.MEDIASTACK_API_KEY
  if (!key) return []

  const url = new URL('http://api.mediastack.com/v1/news')
  url.searchParams.set('access_key', key)
  url.searchParams.set('languages', 'en')
  if (query) url.searchParams.set('keywords', query)

  const payload = await readJson(url.toString())
  return (payload.data ?? []).map((item: any) => ({
    provider: 'mediastack',
    title: clean(item.title),
    description: clean(item.description),
    url: clean(item.url),
    imageUrl: clean(item.image) || null,
    source: clean(item.source),
    publishedAt: clean(item.published_at) || null,
    category: clean(item.category) || null,
    country: clean(item.country) || null,
  }))
}

export async function fetchExternalNews({
  provider = 'newsdata',
  query,
}: {
  provider?: ExternalNewsProvider | 'all'
  query?: string
}) {
  if (provider === 'newsdata') return fetchNewsDataLatest(query)
  if (provider === 'gnews') return fetchGNewsLatest(query)
  if (provider === 'mediastack') return fetchMediastackLatest(query)

  const results = await Promise.allSettled([
    fetchNewsDataLatest(query),
    fetchGNewsLatest(query),
    fetchMediastackLatest(query),
  ])

  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}
