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

export function looksTruncated(text?: string | null) {
  if (!text?.trim() || isPaidPlanPlaceholder(text)) return true
  const trimmed = text.trim()
  if (trimmed.endsWith('...') || trimmed.endsWith('…')) return true
  if (MID_TRUNCATION.test(trimmed)) return true
  if (WORDPRESS_FOOTER.test(trimmed)) return true
  return trimmed.split(/\s+/).filter(Boolean).length < 90
}

export function isSyndicatedContentComplete(content?: string | null) {
  if (!content?.trim() || isPersistedStubContent(content) || isPaidPlanPlaceholder(content)) return false
  const words = syndicatedWordCount(content)
  if (words < 180) return false
  if (looksTruncated(content)) return false
  return true
}

export function needsSyndicatedBodyFetch(content?: string | null) {
  if (!content?.trim() || isPersistedStubContent(content) || isPaidPlanPlaceholder(content)) return true
  if (!isSyndicatedContentComplete(content)) return true
  return false
}
