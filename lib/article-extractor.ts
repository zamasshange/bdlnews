import 'server-only'

import { cleanWireExcerpt, syndicatedWordCount } from '@/lib/syndicated-content'

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

function stripTags(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function extractMeta(html: string, property: string) {
  const match =
    html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
  return match?.[1] ? decodeHtml(match[1]).trim() : ''
}

function extractTweetUrlFromMarkup(markup: string) {
  const href =
    markup.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"']*\/status\/\d+[^"']*)["']/i)?.[1] ??
    markup.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/i\/status\/\d+[^"']*)["']/i)?.[1]

  if (!href) return null
  const id = href.match(/status\/(\d+)/i)?.[1]
  return id ? `https://twitter.com/i/status/${id}` : href.split('?')[0]
}

function extractTweetUrlsFromHtml(html: string) {
  const urls = new Set<string>()

  for (const match of html.matchAll(/<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][^>]*>[\s\S]*?<\/blockquote>/gi)) {
    const url = extractTweetUrlFromMarkup(match[0])
    if (url) urls.add(url)
  }

  for (const match of html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"']*\/status\/\d+[^"']*)["']/gi)) {
    const url = extractTweetUrlFromMarkup(match[0])
    if (url) urls.add(url)
  }

  return [...urls]
}

function collectJsonLdNodes(parsed: unknown): Record<string, unknown>[] {
  if (!parsed) return []
  if (Array.isArray(parsed)) return parsed.flatMap(collectJsonLdNodes)
  if (typeof parsed !== 'object') return []

  const node = parsed as Record<string, unknown>
  const graph = node['@graph']
  if (Array.isArray(graph)) {
    return graph.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
  }
  return [node]
}

function extractJsonLdBody(html: string) {
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1])
      for (const node of collectJsonLdNodes(parsed)) {
        const body = typeof node.articleBody === 'string' ? stripTags(node.articleBody) : ''
        if (body.length > 200) {
          return {
            content: body,
            imageCredit: typeof node.author === 'object' && node.author && typeof (node.author as { name?: string }).name === 'string'
              ? (node.author as { name: string }).name
              : undefined,
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null
}

function extractParagraphsFromHtml(html: string) {
  const contentRegions = [
    html.match(/<article[\s\S]*?<\/article>/i)?.[0],
    html.match(/<main[\s\S]*?<\/main>/i)?.[0],
    html.match(/<div[^>]+class=["'][^"']*(?:entry-content|td-post-content|article-content|post-content|story-body|article__body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[0],
  ].filter(Boolean) as string[]

  for (const region of contentRegions) {
    const tokens = region.split(
      /(<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][^>]*>[\s\S]*?<\/blockquote>)/gi,
    )
    const parts: string[] = []

    for (const token of tokens) {
      if (/twitter-tweet/i.test(token)) {
        const tweetUrl = extractTweetUrlFromMarkup(token)
        if (tweetUrl) parts.push(tweetUrl)
        continue
      }

      const paragraphs = [...token.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((entry) => stripTags(entry[1] ?? ''))
        .filter((text) => text.length > 30)

      parts.push(...paragraphs)
    }

    if (parts.length >= 2) return parts.join('\n\n')
  }

  return ''
}

function normalizeArticlePath(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.pathname.replace(/\/+$/, '')
  } catch {
    return url
  }
}

async function fetchText(url: string, timeoutMs = 10000) {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) return null
  return response.text()
}

function extractRssItemContent(itemMarkup: string) {
  const encoded =
    itemMarkup.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i)?.[1] ??
    itemMarkup.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
    itemMarkup.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ??
    itemMarkup.match(/<description>([\s\S]*?)<\/description>/i)?.[1]

  if (!encoded) return ''

  const paragraphs = [...encoded.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((entry) => stripTags(entry[1] ?? ''))
    .filter((text) => text.length > 30)

  if (paragraphs.length >= 2) return paragraphs.join('\n\n')
  return stripTags(encoded)
}

async function extractFromSiteRss(url: string) {
  let origin = ''
  try {
    origin = new URL(url).origin
  } catch {
    return null
  }

  const targetPath = normalizeArticlePath(url)
  const maxPages = 6
  const feeds = await Promise.all(
    Array.from({ length: maxPages }, (_, index) => {
      const page = index + 1
      const feedUrl = page === 1 ? `${origin}/feed/` : `${origin}/feed/?paged=${page}`
      return fetchText(feedUrl, 7000)
    }),
  )

  for (const feed of feeds) {
    if (!feed || (!feed.includes('<rss') && !feed.includes('<feed'))) continue

    const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    if (!items.length) continue

    for (const item of items) {
      const link =
        item[1].match(/<link>([^<]+)<\/link>/i)?.[1]?.trim() ??
        item[1].match(/<guid[^>]*>([^<]+)<\/guid>/i)?.[1]?.trim() ??
        ''

      if (!link) continue
      if (normalizeArticlePath(link) !== targetPath && !link.includes(targetPath)) continue

      const content = cleanWireExcerpt(extractRssItemContent(item[1]))
      if (syndicatedWordCount(content) >= 120) {
        return { content, imageCredit: undefined as string | undefined }
      }
    }
  }

  return null
}

function extractFromHtml(html: string) {
  const tweetUrls = extractTweetUrlsFromHtml(html)
  const jsonLd = extractJsonLdBody(html)
  if (jsonLd?.content) {
    return { content: jsonLd.content, tweetUrls, imageCredit: jsonLd.imageCredit }
  }

  const content = extractParagraphsFromHtml(html)
  const ogDescription = extractMeta(html, 'og:description')
  const resolvedContent = cleanWireExcerpt(content || ogDescription)

  if (!resolvedContent || resolvedContent.length < 120) return null

  return {
    content: resolvedContent,
    tweetUrls,
    imageCredit: extractMeta(html, 'og:image:alt') || undefined,
  }
}

export async function extractOgImageFromUrl(url: string) {
  try {
    const html = await fetchText(url, 8000)
    if (!html) return null

    const ogImage =
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      extractMeta(html, 'twitter:image:src')

    if (!ogImage) return null
    if (ogImage.startsWith('http')) return ogImage
    if (ogImage.startsWith('//')) return `https:${ogImage}`
    if (ogImage.startsWith('/')) {
      const origin = new URL(url).origin
      return `${origin}${ogImage}`
    }
    return null
  } catch {
    return null
  }
}

export {
  SYNDICATED_STUB_MARKER,
  cleanWireExcerpt,
  isPersistedStubContent,
  isSyndicatedContentComplete,
  looksTruncated,
  needsSyndicatedBodyFetch,
  syndicatedWordCount,
} from '@/lib/syndicated-content'

export function contentNeedsTwitterEnhancement(content?: string | null) {
  if (!content?.trim()) return false
  return /pic\.twitter\.com|(?:https?:\/\/)?t\.co\/|twitter\.com\/.*status|x\.com\/.*status/i.test(content)
}

export async function extractArticleBodyFromUrl(url: string) {
  try {
    const rssExtracted = await extractFromSiteRss(url)
    if (rssExtracted?.content) {
      return {
        content: rssExtracted.content,
        tweetUrls: [] as string[],
        imageCredit: rssExtracted.imageCredit,
      }
    }

    const html = await fetchText(url, 8000)
    if (html && !/Just a moment|cf-chl|security verification/i.test(html)) {
      const extracted = extractFromHtml(html)
      if (extracted && syndicatedWordCount(extracted.content) >= 120) {
        return extracted
      }
    }

    return null
  } catch {
    return null
  }
}

export function buildWireImageCaption(article: {
  title: string
  dek?: string
  author?: string
  imageCredit?: string
}) {
  const lead = article.dek?.trim() || article.title
  const credit = article.imageCredit?.trim() || article.author?.trim()
  if (credit) {
    return `${lead} (Photo: ${credit})`
  }
  return lead
}
