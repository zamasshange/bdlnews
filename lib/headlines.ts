export function shortHeadline(title: string, maxLength = 88) {
  const cleaned = title.replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.length <= maxLength) return cleaned

  const slice = cleaned.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  const trimmed = (lastSpace > Math.floor(maxLength * 0.55) ? slice.slice(0, lastSpace) : slice).trim()

  return `${trimmed}…`
}

export const headlineLimits = {
  hero: 92,
  feature: 88,
  rail: 72,
  card: 80,
  compact: 64,
  ticker: 52,
} as const
