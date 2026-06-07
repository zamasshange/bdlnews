export function extractArticleText(content?: string | null): string {
  if (!content?.trim()) return ''

  try {
    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) return content

    return parsed
      .map((block: Record<string, unknown>) => {
        if (typeof block.text === 'string') return block.text
        if (typeof block.html === 'string') return block.html.replace(/<[^>]+>/g, ' ')
        if (typeof block.caption === 'string') return block.caption
        if (Array.isArray(block.items)) return block.items.map(String).join('\n')
        return ''
      })
      .filter(Boolean)
      .join('\n\n')
  } catch {
    return content
  }
}

export function buildArticleContext(article: {
  title?: string | null
  dek?: string | null
  content?: string | null
  category?: string | null
  author?: string | null
}): string {
  return [
    article.title,
    article.dek,
    extractArticleText(article.content),
    article.category,
    article.author,
  ]
    .filter(Boolean)
    .join('\n\n')
}
