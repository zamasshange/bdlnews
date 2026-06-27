import { createHash } from 'crypto'

const TRACKING_PARAMS = [
  'traffic_source',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'ref',
  'mc_cid',
  'mc_eid',
]

export function normalizeWireUrl(url: string) {
  try {
    const parsed = new URL(url.trim())
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param)
    }
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url.trim()
  }
}

function hashSlug(value: string) {
  return `ext-${createHash('sha256').update(value).digest('hex').slice(0, 12)}`
}

/** Canonical slug for new wire articles (tracking params stripped). */
export function externalArticleSlug(url: string) {
  return hashSlug(normalizeWireUrl(url))
}

/** Legacy slug variants that may exist in older links or RSS URLs. */
export function allWireSlugsForUrl(url: string) {
  const slugs = new Set<string>()
  const trimmed = url.trim()

  slugs.add(hashSlug(trimmed))
  slugs.add(hashSlug(normalizeWireUrl(trimmed)))

  try {
    const parsed = new URL(trimmed)
    if (!parsed.searchParams.has('traffic_source')) {
      parsed.searchParams.set('traffic_source', 'rss')
      slugs.add(hashSlug(parsed.toString()))
    }
  } catch {
    // ignore invalid URLs
  }

  return slugs
}

export function matchesWireSlug(articleSlug: string, targetSlug: string, externalUrl?: string | null) {
  if (articleSlug === targetSlug) return true
  if (!externalUrl) return false
  return allWireSlugsForUrl(externalUrl).has(targetSlug)
}
