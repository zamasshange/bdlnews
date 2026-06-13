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

function extractParagraphs(html: string) {
  const matches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  const paragraphs = matches
    .map((match) => stripTags(match[1] ?? ''))
    .filter((text) => text.length > 40)

  if (paragraphs.length >= 2) return paragraphs.join('\n\n')

  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i)?.[0]
  if (articleMatch) {
    const articleText = stripTags(articleMatch)
    if (articleText.length > 200) return articleText
  }

  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i)?.[0]
  if (mainMatch) {
    const mainText = stripTags(mainMatch)
    if (mainText.length > 200) return mainText
  }

  return ''
}

export function looksTruncated(text?: string | null) {
  if (!text?.trim()) return true
  const trimmed = text.trim()
  if (trimmed.endsWith('...') || trimmed.endsWith('…')) return true
  return trimmed.split(/\s+/).filter(Boolean).length < 90
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
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) return null

    const html = await response.text()
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
              imageCredit: typeof node?.author?.name === 'string' ? node.author.name : undefined,
            }
          }
        }
      } catch {
        // ignore malformed JSON-LD
      }
    }

    const paragraphs = extractParagraphs(html)
    const ogDescription = extractMeta(html, 'og:description')
    const content = paragraphs || ogDescription

    if (!content || content.length < 120) return null

    return {
      content,
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
