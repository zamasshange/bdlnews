export const SYNDICATED_STUB_MARKER = 'This story continues on the original publisher'

export function isPersistedStubContent(content?: string | null) {
  return content?.includes(SYNDICATED_STUB_MARKER) ?? false
}

export function syndicatedWordCount(content?: string | null) {
  return (content ?? '').split(/\s+/).filter(Boolean).length
}

export function looksTruncated(text?: string | null) {
  if (!text?.trim()) return true
  const trimmed = text.trim()
  if (trimmed.endsWith('...') || trimmed.endsWith('…')) return true
  return trimmed.split(/\s+/).filter(Boolean).length < 90
}

export function needsSyndicatedBodyFetch(content?: string | null) {
  if (!content?.trim() || isPersistedStubContent(content)) return true
  const words = syndicatedWordCount(content)
  if (words < 120) return true
  if (looksTruncated(content) && words < 220) return true
  return false
}
