const TWITTER_STATUS_URL =
  /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/(\d+)(?:\?[A-Za-z0-9&=_%-]*)?/gi

export type RichSegment =
  | { kind: 'text'; value: string }
  | { kind: 'twitter'; url: string; html: string }

export function isTwitterStatusUrl(value: string) {
  const trimmed = value.trim()
  return /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+(?:\?[A-Za-z0-9&=_%-]*)?$/i.test(
    trimmed,
  )
}

export function normalizeTwitterUrl(url: string) {
  const id = url.match(/status\/(\d+)/i)?.[1]
  if (id) return `https://twitter.com/i/status/${id}`
  return url.trim()
}

function findTwitterStatusUrls(text: string) {
  const hits: { url: string; index: number; length: number }[] = []
  const regex = new RegExp(TWITTER_STATUS_URL.source, 'gi')
  let match: RegExpExecArray | null = regex.exec(text)

  while (match) {
    hits.push({ url: match[0], index: match.index, length: match[0].length })
    match = regex.exec(text)
  }

  return hits
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

export async function buildRichSegments(text: string): Promise<RichSegment[]> {
  if (!text.trim()) return []

  const hits = findTwitterStatusUrls(text)
  if (!hits.length) return [{ kind: 'text', value: text }]

  const segments: RichSegment[] = []
  let cursor = 0

  for (const hit of hits) {
    if (hit.index > cursor) {
      const chunk = text.slice(cursor, hit.index)
      if (chunk.trim()) segments.push({ kind: 'text', value: chunk })
    }

    const html = await fetchTwitterOembed(hit.url)
    if (html) {
      segments.push({ kind: 'twitter', url: hit.url, html })
    } else {
      segments.push({ kind: 'text', value: hit.url })
    }

    cursor = hit.index + hit.length
  }

  if (cursor < text.length) {
    const tail = text.slice(cursor)
    if (tail.trim()) segments.push({ kind: 'text', value: tail })
  }

  return segments
}

export async function buildRichSegmentsForBlocks(values: string[]) {
  const uniqueUrls = new Set<string>()
  for (const value of values) {
    for (const hit of findTwitterStatusUrls(value)) {
      uniqueUrls.add(hit.url)
    }
  }

  const htmlByUrl = new Map<string, string | null>()
  await Promise.all(
    [...uniqueUrls].map(async (url) => {
      htmlByUrl.set(url, await fetchTwitterOembed(url))
    }),
  )

  return async (text: string) => {
    const hits = findTwitterStatusUrls(text)
    if (!hits.length) return [{ kind: 'text', value: text }] satisfies RichSegment[]

    const segments: RichSegment[] = []
    let cursor = 0

    for (const hit of hits) {
      if (hit.index > cursor) {
        const chunk = text.slice(cursor, hit.index)
        if (chunk.trim()) segments.push({ kind: 'text', value: chunk })
      }

      const html = htmlByUrl.get(hit.url)
      if (html) {
        segments.push({ kind: 'twitter', url: hit.url, html })
      } else {
        segments.push({ kind: 'text', value: hit.url })
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
