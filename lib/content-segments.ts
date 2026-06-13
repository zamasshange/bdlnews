const TWITTER_STATUS_URL =
  /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+\/)?status\/(\d+)(?:\?[A-Za-z0-9&=_%-]*)?/gi

const PIC_TWITTER_URL = /(?:https?:\/\/)?(?:www\.)?pic\.twitter\.com\/([A-Za-z0-9]+)/gi

const TCO_URL = /(?:https?:\/\/)?t\.co\/([A-Za-z0-9]+)/gi

const GENERIC_URL = /(?:https?:\/\/|www\.)[^\s<>"']+/gi

export type ContentSegment =
  | { kind: 'text'; value: string }
  | { kind: 'twitter'; value: string }
  | { kind: 'link'; value: string; href: string }

export function isTwitterStatusUrl(value: string) {
  const trimmed = value.trim()
  return /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[A-Za-z0-9_]+\/)?status\/\d+(?:\?[A-Za-z0-9&=_%-]*)?$/i.test(
    trimmed,
  )
}

export function isTwitterReference(value: string) {
  return (
    isTwitterStatusUrl(value) ||
    /^(?:https?:\/\/)?(?:www\.)?pic\.twitter\.com\//i.test(value) ||
    /^(?:https?:\/\/)?t\.co\//i.test(value)
  )
}

function findTwitterHits(text: string) {
  const hits: { value: string; index: number; length: number }[] = []
  const patterns = [TWITTER_STATUS_URL, PIC_TWITTER_URL, TCO_URL]

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, 'gi')
    let match: RegExpExecArray | null = regex.exec(text)
    while (match) {
      hits.push({ value: match[0], index: match.index, length: match[0].length })
      match = regex.exec(text)
    }
  }

  hits.sort((a, b) => a.index - b.index)

  const deduped: typeof hits = []
  for (const hit of hits) {
    if (deduped.some((existing) => hit.index >= existing.index && hit.index < existing.index + existing.length)) {
      continue
    }
    deduped.push(hit)
  }

  return deduped
}

export function parseInlineContent(text: string): ContentSegment[] {
  if (!text.trim()) return []

  const hits = findTwitterHits(text)
  if (!hits.length) return linkifyPlainText(text)

  const segments: ContentSegment[] = []
  let cursor = 0

  for (const hit of hits) {
    if (hit.index > cursor) {
      segments.push(...linkifyPlainText(text.slice(cursor, hit.index)))
    }
    segments.push({ kind: 'twitter', value: hit.value })
    cursor = hit.index + hit.length
  }

  if (cursor < text.length) {
    segments.push(...linkifyPlainText(text.slice(cursor)))
  }

  return segments
}

function normalizeHref(value: string) {
  if (value.startsWith('http')) return value
  if (value.startsWith('www.')) return `https://${value}`
  return value
}

function linkifyPlainText(text: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  const regex = new RegExp(GENERIC_URL.source, 'gi')
  let cursor = 0
  let match: RegExpExecArray | null = regex.exec(text)

  while (match) {
    if (match.index > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, match.index) })
    }

    const href = normalizeHref(match[0])
    if (isTwitterReference(href)) {
      segments.push({ kind: 'twitter', value: match[0] })
    } else {
      segments.push({ kind: 'link', value: match[0], href })
    }

    cursor = match.index + match[0].length
    match = regex.exec(text)
  }

  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) })
  }

  if (!segments.length && text) {
    segments.push({ kind: 'text', value: text })
  }

  return segments
}

export function splitParagraphs(content: string) {
  return content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
}

export function isStandaloneTwitterParagraph(paragraph: string) {
  const trimmed = paragraph.trim()
  return isTwitterReference(trimmed) && !trimmed.includes(' ')
}
