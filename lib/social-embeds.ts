const TWITTER_STATUS_URL =
  /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+\/)?status\/(\d+)(?:\?[A-Za-z0-9&=_%-]*)?/gi

const PIC_TWITTER_URL = /(?:https?:\/\/)?(?:www\.)?pic\.twitter\.com\/([A-Za-z0-9]+)/gi

const TCO_URL = /(?:https?:\/\/)?t\.co\/([A-Za-z0-9]+)/gi

export type RichSegment =
  | { kind: 'text'; value: string }
  | { kind: 'twitter'; url: string; html: string }

type UrlHit = {
  raw: string
  index: number
  length: number
  kind: 'status' | 'pic' | 'tco'
}

export function isTwitterStatusUrl(value: string) {
  const trimmed = value.trim()
  return /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+\/)?status\/\d+(?:\?[A-Za-z0-9&=_%-]*)?$/i.test(
    trimmed,
  )
}

export function normalizeTwitterUrl(url: string) {
  const id = url.match(/status\/(\d+)/i)?.[1]
  if (id) return `https://twitter.com/i/status/${id}`
  return url.trim()
}

function withProtocol(url: string) {
  return url.startsWith('http') ? url : `https://${url.replace(/^\/\//, '')}`
}

async function resolveRedirectToStatusUrl(input: string): Promise<string | null> {
  try {
    const response = await fetch(withProtocol(input), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BDLNewsBot/1.0; +https://bdlnews.online) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 60 * 60 * 6 },
    })

    const finalUrl = response.url || input
    if (/status\/\d+/i.test(finalUrl)) return normalizeTwitterUrl(finalUrl)

    const html = await response.text()
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      html.match(/href=["'](https?:\/\/(?:twitter\.com|x\.com)[^"']*\/status\/\d+[^"']*)["']/i)?.[1]

    if (canonical && /status\/\d+/i.test(canonical)) {
      return normalizeTwitterUrl(canonical)
    }
  } catch {
    return null
  }

  return null
}

export async function resolveTweetStatusUrl(input: string): Promise<string | null> {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (isTwitterStatusUrl(trimmed) || /(?:twitter\.com|x\.com)\/.*status\/\d+/i.test(trimmed)) {
    return normalizeTwitterUrl(withProtocol(trimmed))
  }

  if (/^(?:https?:\/\/)?(?:www\.)?pic\.twitter\.com\//i.test(trimmed) || /^pic\.twitter\.com\//i.test(trimmed)) {
    return resolveRedirectToStatusUrl(trimmed)
  }

  if (/^(?:https?:\/\/)?t\.co\//i.test(trimmed) || /^t\.co\//i.test(trimmed)) {
    return resolveRedirectToStatusUrl(trimmed)
  }

  return null
}

function findTwitterUrlHits(text: string): UrlHit[] {
  const hits: UrlHit[] = []

  const statusRegex = new RegExp(TWITTER_STATUS_URL.source, 'gi')
  let match: RegExpExecArray | null = statusRegex.exec(text)
  while (match) {
    hits.push({ raw: match[0], index: match.index, length: match[0].length, kind: 'status' })
    match = statusRegex.exec(text)
  }

  const picRegex = new RegExp(PIC_TWITTER_URL.source, 'gi')
  match = picRegex.exec(text)
  while (match) {
    hits.push({ raw: match[0], index: match.index, length: match[0].length, kind: 'pic' })
    match = picRegex.exec(text)
  }

  const tcoRegex = new RegExp(TCO_URL.source, 'gi')
  match = tcoRegex.exec(text)
  while (match) {
    hits.push({ raw: match[0], index: match.index, length: match[0].length, kind: 'tco' })
    match = tcoRegex.exec(text)
  }

  hits.sort((a, b) => a.index - b.index)

  const deduped: UrlHit[] = []
  for (const hit of hits) {
    const overlaps = deduped.some(
      (existing) => hit.index >= existing.index && hit.index < existing.index + existing.length,
    )
    if (!overlaps) deduped.push(hit)
  }

  return deduped
}

export async function fetchTwitterOembed(url: string): Promise<string | null> {
  try {
    const endpoint = new URL('https://publish.twitter.com/oembed')
    endpoint.searchParams.set('url', normalizeTwitterUrl(url))
    endpoint.searchParams.set('omit_script', 'true')
    endpoint.searchParams.set('dnt', 'true')
    endpoint.searchParams.set('lang', 'en')
    endpoint.searchParams.set('theme', 'light')

    const response = await fetch(endpoint.toString(), {
      next: { revalidate: 60 * 60 * 12 },
    })

    if (!response.ok) return null

    const payload = (await response.json()) as { html?: string }
    return typeof payload.html === 'string' ? payload.html : null
  } catch {
    return null
  }
}

async function resolveHitsToStatusUrls(hits: UrlHit[]) {
  const resolved = new Map<string, string | null>()

  await Promise.all(
    hits.map(async (hit) => {
      if (hit.kind === 'status') {
        resolved.set(hit.raw, normalizeTwitterUrl(withProtocol(hit.raw)))
        return
      }
      resolved.set(hit.raw, await resolveTweetStatusUrl(hit.raw))
    }),
  )

  return resolved
}

async function buildSegmentsFromHits(text: string, hits: UrlHit[]) {
  if (!hits.length) return [{ kind: 'text', value: text }] satisfies RichSegment[]

  const resolved = await resolveHitsToStatusUrls(hits)
  const statusUrls = [...new Set([...resolved.values()].filter(Boolean))] as string[]

  const htmlByStatusUrl = new Map<string, string | null>()
  await Promise.all(
    statusUrls.map(async (url) => {
      htmlByStatusUrl.set(url, await fetchTwitterOembed(url))
    }),
  )

  const segments: RichSegment[] = []
  let cursor = 0

  for (const hit of hits) {
    if (hit.index > cursor) {
      const chunk = text.slice(cursor, hit.index)
      if (chunk.trim()) segments.push({ kind: 'text', value: chunk })
    }

    const statusUrl = resolved.get(hit.raw)
    const html = statusUrl ? htmlByStatusUrl.get(statusUrl) : null

    if (statusUrl && html) {
      segments.push({ kind: 'twitter', url: statusUrl, html })
    } else {
      segments.push({ kind: 'text', value: hit.raw })
    }

    cursor = hit.index + hit.length
  }

  if (cursor < text.length) {
    const tail = text.slice(cursor)
    if (tail.trim()) segments.push({ kind: 'text', value: tail })
  }

  return segments
}

export async function buildRichSegments(text: string): Promise<RichSegment[]> {
  if (!text.trim()) return []
  const hits = findTwitterUrlHits(text)
  if (!hits.length) return [{ kind: 'text', value: text }]
  return buildSegmentsFromHits(text, hits)
}

export async function buildRichSegmentsForBlocks(values: string[]) {
  const allHits: UrlHit[] = []

  for (const value of values) {
    allHits.push(...findTwitterUrlHits(value))
  }

  const resolved = await resolveHitsToStatusUrls(allHits)
  const statusUrls = [...new Set([...resolved.values()].filter(Boolean))] as string[]

  const htmlByStatusUrl = new Map<string, string | null>()
  await Promise.all(
    statusUrls.map(async (url) => {
      htmlByStatusUrl.set(url, await fetchTwitterOembed(url))
    }),
  )

  return async (text: string) => {
    const hits = findTwitterUrlHits(text)
    if (!hits.length) return [{ kind: 'text', value: text }] satisfies RichSegment[]

    const segments: RichSegment[] = []
    let cursor = 0

    for (const hit of hits) {
      if (hit.index > cursor) {
        const chunk = text.slice(cursor, hit.index)
        if (chunk.trim()) segments.push({ kind: 'text', value: chunk })
      }

      const statusUrl = resolved.get(hit.raw) ?? (hit.kind === 'status' ? normalizeTwitterUrl(withProtocol(hit.raw)) : null)
      const html = statusUrl ? htmlByStatusUrl.get(statusUrl) : null

      if (statusUrl && html) {
        segments.push({ kind: 'twitter', url: statusUrl, html })
      } else {
        segments.push({ kind: 'text', value: hit.raw })
      }

      cursor = hit.index + hit.length
    }

    if (cursor < text.length) {
      const tail = text.slice(cursor)
      if (tail.trim()) segments.push({ kind: 'text', value: tail })
    }

    return segments
  }
}

export function collectTwitterUrlsFromContent(content?: string | null, blocks?: unknown[] | null) {
  const values: string[] = []
  if (content?.trim()) values.push(content)

  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue
      const record = block as Record<string, unknown>
      for (const key of ['text', 'html', 'url', 'caption']) {
        if (typeof record[key] === 'string') values.push(record[key] as string)
      }
    }
  }

  return values
}

export function countResolvableTwitterLinks(content?: string | null) {
  if (!content?.trim()) return 0
  return findTwitterUrlHits(content).length
}

export function mergeExtractedTweetUrls(content: string, extractedContent: string) {
  const extractedParagraphs = extractedContent.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const tweetParagraphs = extractedParagraphs.filter((part) => isTwitterStatusUrl(part))

  if (!tweetParagraphs.length) return content

  const contentParagraphs = content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const merged: string[] = []
  let tweetIndex = 0

  for (const paragraph of contentParagraphs) {
    merged.push(paragraph)

    const hasPicLink = /pic\.twitter\.com/i.test(paragraph)
    const hasStatusLink = findTwitterUrlHits(paragraph).some((hit) => hit.kind === 'status')

    if ((hasPicLink || /pic\.twitter\.com/i.test(paragraph)) && !hasStatusLink && tweetIndex < tweetParagraphs.length) {
      merged.push(tweetParagraphs[tweetIndex])
      tweetIndex += 1
    }
  }

  while (tweetIndex < tweetParagraphs.length) {
    merged.push(tweetParagraphs[tweetIndex])
    tweetIndex += 1
  }

  return merged.join('\n\n')
}
