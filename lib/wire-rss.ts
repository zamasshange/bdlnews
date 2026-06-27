import 'server-only'

import type { ExternalNewsItem } from '@/lib/external-news'

const WIRE_RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
] as const

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function readTag(item: string, tag: string) {
  const cdata = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))?.[1]
  if (cdata) return cdata.trim()
  return item.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))?.[1]?.trim() ?? ''
}

function parseRss(xml: string, sourceLabel: string): ExternalNewsItem[] {
  if (!xml.includes('<item') && !xml.includes('<entry')) return []

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  return items
    .map((match) => {
      const item = match[1]
      const title = stripTags(readTag(item, 'title'))
      const link =
        readTag(item, 'link') ||
        item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]?.trim() ||
        readTag(item, 'guid')
      const description = stripTags(
        readTag(item, 'description') || readTag(item, 'content:encoded') || readTag(item, 'summary'),
      )
      const publishedAt = readTag(item, 'pubDate') || readTag(item, 'published') || readTag(item, 'updated')
      const imageUrl =
        item.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ||
        item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] ||
        item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
        null

      if (!title || !link) return null

      return {
        provider: 'newsdata' as const,
        title,
        description: description.slice(0, 500),
        content: description,
        url: link,
        imageUrl,
        source: sourceLabel,
        publishedAt: publishedAt || new Date().toISOString(),
        category: null,
        country: null,
      }
    })
    .filter((item): item is ExternalNewsItem => Boolean(item))
}

async function fetchFeed(url: string): Promise<ExternalNewsItem[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'BDLNewsWire/1.0' },
    })
    if (!response.ok) return []
    const xml = await response.text()
    let sourceLabel = 'Wire'
    try {
      sourceLabel = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      // keep default
    }
    return parseRss(xml, sourceLabel)
  } catch {
    return []
  }
}

export async function fetchWireFromRssFeeds(limit = 80): Promise<ExternalNewsItem[]> {
  const results = await Promise.allSettled(WIRE_RSS_FEEDS.map((url) => fetchFeed(url)))
  const seen = new Set<string>()
  const merged: ExternalNewsItem[] = []

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const item of result.value) {
      if (!item.url || seen.has(item.url)) continue
      seen.add(item.url)
      merged.push(item)
      if (merged.length >= limit) return merged
    }
  }

  return merged
}
