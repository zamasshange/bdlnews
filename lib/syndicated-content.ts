export const SYNDICATED_STUB_MARKER = 'This story continues on the original publisher'

const WORDPRESS_FOOTER = /\s*The post .+ appeared first on .+\.?\s*$/i
const PAID_PLAN_MARKER = /ONLY AVAILABLE IN PAID PLANS/i
const MID_TRUNCATION = /\[\.\.\.\]|\[\s*…\s*\]|…{2,}|\.{3,}/

export function isPersistedStubContent(content?: string | null) {
  return content?.includes(SYNDICATED_STUB_MARKER) ?? false
}

export function syndicatedWordCount(content?: string | null) {
  return (content ?? '').split(/\s+/).filter(Boolean).length
}

export function isPaidPlanPlaceholder(content?: string | null) {
  return PAID_PLAN_MARKER.test(content ?? '')
}

export function cleanWireExcerpt(content?: string | null) {
  if (!content?.trim() || isPaidPlanPlaceholder(content)) return ''
  return content
    .replace(MID_TRUNCATION, ' ')
    .replace(WORDPRESS_FOOTER, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isGarbageArticleContent(content?: string | null) {
  if (!content?.trim()) return true

  const text = content.trim()
  const words = syndicatedWordCount(text)
  const markdownLinks = (text.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) ?? []).length
  const bareUrls = (text.match(/https?:\/\/\S+/g) ?? []).length
  const linkTokens = markdownLinks + bareUrls

  if (markdownLinks >= 4) return true
  if (bareUrls >= 6) return true
  if (words > 0 && linkTokens / words > 0.12) return true
  if (/Subscribe\s*\]|\bNews\]\(|\bPrivacy Policy\b|\bTerms (?:&|and) Conditions\b/i.test(text) && linkTokens >= 2) {
    return true
  }
  if (/^\s*(\*?\s*\[[^\]]+\]\([^)]+\)\s*){3,}/m.test(text)) return true

  return false
}

export function looksTruncated(text?: string | null) {
  if (!text?.trim() || isPaidPlanPlaceholder(text)) return true
  const trimmed = text.trim()
  if (trimmed.endsWith('...') || trimmed.endsWith('…')) return true
  if (MID_TRUNCATION.test(trimmed)) return true
  if (WORDPRESS_FOOTER.test(trimmed)) return true
  return false
}

export function isSyndicatedContentComplete(content?: string | null) {
  if (!content?.trim() || isPersistedStubContent(content) || isPaidPlanPlaceholder(content)) return false
  if (isGarbageArticleContent(content)) return false
  if (looksTruncated(content)) return false
  return syndicatedWordCount(content) >= 80
}

export function needsSyndicatedBodyFetch(content?: string | null) {
  if (!content?.trim() || isPersistedStubContent(content) || isPaidPlanPlaceholder(content)) return true
  if (isGarbageArticleContent(content)) return true
  if (!isSyndicatedContentComplete(content)) return true
  return false
}

export function sanitizeArticleBody(content?: string | null) {
  if (!content?.trim() || isGarbageArticleContent(content)) return ''

  const paragraphs = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 40 && !isGarbageArticleContent(part))

  if (paragraphs.length >= 2) return paragraphs.join('\n\n')
  if (paragraphs.length === 1 && syndicatedWordCount(paragraphs[0]) >= 80) return paragraphs[0]
  return isGarbageArticleContent(content) ? '' : content.trim()
}
