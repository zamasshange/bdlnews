import 'server-only'

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
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

function extractContentInOrder(html: string) {
  const articleHtml = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html
  const mainHtml = articleHtml.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? articleHtml
  const tokens = mainHtml.split(
    /(<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][^>]*>[\s\S]*?<\/blockquote>)/gi,
  )

  const parts: string[] = []

  for (const token of tokens) {
    if (/twitter-tweet/i.test(token)) {
      const url = extractTweetUrlFromMarkup(token)
      if (url) parts.push(url)
      continue
    }

    const paragraphs = [...token.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((match) => stripTags(match[1] ?? ''))
      .filter((text) => text.length > 40)

    parts.push(...paragraphs)
  }

  if (parts.length >= 2) return parts.join('\n\n')

  const fallbackParagraphs = [...mainHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1] ?? ''))
    .filter((text) => text.length > 40)

  if (fallbackParagraphs.length >= 2) return fallbackParagraphs.join('\n\n')

  const articleText = stripTags(mainHtml)
  return articleText.length > 200 ? articleText : ''
}

export async function extractOgImageFromUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BDLNewsBot/1.0; +https://bdlnews.online) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return null

    const html = await response.text()
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
  isPersistedStubContent,
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
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BDLNewsBot/1.0; +https://bdlnews.online) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return null

    const html = await response.text()
    const tweetUrls = extractTweetUrlsFromHtml(html)

    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
    if (jsonLdMatch?.[1]) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1])
        const nodes = Array.isArray(parsed) ? parsed : [parsed]
        for (const node of nodes) {
          const body = typeof node?.articleBody === 'string' ? stripTags(node.articleBody) : ''
          if (body.length > 200) {
            return {
              content: body,
              tweetUrls,
              imageCredit: typeof node?.author?.name === 'string' ? node.author.name : undefined,
            }
          }
        }
      } catch {
        // ignore malformed JSON-LD
      }
    }

    const content = extractContentInOrder(html)
    const ogDescription = extractMeta(html, 'og:description')
    const resolvedContent = content || ogDescription

    if (!resolvedContent || resolvedContent.length < 120) return null

    return {
      content: resolvedContent,
      tweetUrls,
      imageCredit: extractMeta(html, 'og:image:alt') || undefined,
    }
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
