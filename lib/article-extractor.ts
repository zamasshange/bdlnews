import 'server-only'

import {
  cleanWireExcerpt,
  isGarbageArticleContent,
  isSyndicatedContentComplete,
  looksTruncated,
  sanitizeArticleBody,
  syndicatedWordCount,
} from '@/lib/syndicated-content'

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

function extractRssItemImage(itemMarkup: string) {
  const fromMedia =
    itemMarkup.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ??
    itemMarkup.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ??
    itemMarkup.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i)?.[1] ??
    itemMarkup.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)?.[1]

  if (fromMedia?.startsWith('http')) return fromMedia

  const encoded =
    itemMarkup.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i)?.[1] ??
    itemMarkup.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1]

  if (!encoded) return undefined

  const imgSrc =
    encoded.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ??
    encoded.match(/src=["']([^"']+)["']/i)?.[1]

  if (!imgSrc) return undefined
  if (imgSrc.startsWith('http')) return imgSrc
  if (imgSrc.startsWith('//')) return `https:${imgSrc}`
  return undefined
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

      const content = usableExtractedContent(cleanWireExcerpt(extractRssItemContent(item[1])))
      if (content) {
        return {
          content,
          imageCredit: undefined as string | undefined,
          imageUrl: extractRssItemImage(item[1]),
        }
      }
    }
  }

  return null
}

function resolveImageUrl(image: string | undefined, pageUrl: string) {
  if (!image?.trim()) return undefined
  if (image.startsWith('http')) return image
  if (image.startsWith('//')) return `https:${image}`
  if (image.startsWith('/')) {
    try {
      return `${new URL(pageUrl).origin}${image}`
    } catch {
      return undefined
    }
  }
  return undefined
}

function extractOgImageFromHtml(html: string, pageUrl: string) {
  const ogImage =
    extractMeta(html, 'og:image') ||
    extractMeta(html, 'twitter:image') ||
    extractMeta(html, 'twitter:image:src')

  return resolveImageUrl(ogImage, pageUrl)
}

function extractFromHtml(html: string, pageUrl: string) {
  const tweetUrls = extractTweetUrlsFromHtml(html)
  const imageUrl = extractOgImageFromHtml(html, pageUrl)
  const jsonLd = extractJsonLdBody(html)
  if (jsonLd?.content) {
    const content = usableExtractedContent(jsonLd.content)
    if (content) {
      return { content, tweetUrls, imageCredit: jsonLd.imageCredit, imageUrl }
    }
  }

  const content = extractParagraphsFromHtml(html)
  const ogDescription = extractMeta(html, 'og:description')
  const resolvedContent = usableExtractedContent(cleanWireExcerpt(content || ogDescription))

  if (!resolvedContent) return null

  return {
    content: resolvedContent,
    tweetUrls,
    imageCredit: extractMeta(html, 'og:image:alt') || undefined,
    imageUrl,
  }
}

export async function extractOgImageFromUrl(url: string) {
  try {
    const html = await fetchText(url, 8000)
    if (!html) return null
    return extractOgImageFromHtml(html, url) ?? null
  } catch {
    return null
  }
}

function usableExtractedContent(content: string) {
  const sanitized = sanitizeArticleBody(content)
  return sanitized && isSyndicatedContentComplete(sanitized) ? sanitized : ''
}

async function extractFromJinaReader(url: string) {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null

    const raw = await response.text()
    const prose = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => {
        if (!line) return false
        if (/^(Title:|URL Source:|Markdown Content:|Published Time:|Image:|={3,})/i.test(line)) return false
        if (/^#{1,6}\s/.test(line) && line.length < 100) return false
        if (/^!\[[^\]]*\]\(https?:\/\//i.test(line)) return false
        if ((line.match(/\]\(https?:\/\//g) ?? []).length >= 2) return false
        if (/^(\*?\s*\[[^\]]+\]\([^)]+\)\s*)+$/i.test(line)) return false
        return line.length >= 50
      })
      .join('\n\n')

    const content = usableExtractedContent(cleanWireExcerpt(prose))
    if (!content) return null

    return {
      content,
      tweetUrls: [] as string[],
      imageCredit: undefined as string | undefined,
      imageUrl: undefined as string | undefined,
    }
  } catch {
    return null
  }
}

export {
  SYNDICATED_STUB_MARKER,
  cleanWireExcerpt,
  isGarbageArticleContent,
  isPersistedStubContent,
  isSyndicatedContentComplete,
  looksTruncated,
  needsSyndicatedBodyFetch,
  sanitizeArticleBody,
  syndicatedWordCount,
} from '@/lib/syndicated-content'

export function contentNeedsTwitterEnhancement(content?: string | null) {
  if (!content?.trim()) return false
  return /pic\.twitter\.com|(?:https?:\/\/)?t\.co\/|twitter\.com\/.*status|x\.com\/.*status/i.test(content)
}

export async function extractArticleBodyFromUrl(url: string) {
  try {
    const rssPromise = extractFromSiteRss(url)
    const htmlPromise = fetchText(url, 7000).then((html) => {
      if (!html || /Just a moment|cf-chl|security verification/i.test(html)) return null
      return extractFromHtml(html, url)
    })

    const [rssExtracted, htmlExtracted] = await Promise.all([rssPromise, htmlPromise])

    for (const candidate of [rssExtracted, htmlExtracted]) {
      if (!candidate?.content) continue
      const content = usableExtractedContent(candidate.content)
      if (!content) continue
      return {
        content,
        tweetUrls: candidate.tweetUrls ?? [],
        imageCredit: candidate.imageCredit,
        imageUrl: candidate.imageUrl,
      }
    }

    const jinaExtracted = await extractFromJinaReader(url)
    if (jinaExtracted?.content) {
      return jinaExtracted
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
