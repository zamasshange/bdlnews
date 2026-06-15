import 'server-only'

import type { Article } from '@/lib/data'
import { getLatestWireArticles, getLiveUpdates, getPublishedArticles, getTrendingArticles } from '@/lib/news'
import { siteConfig } from '@/lib/site'

function formatStory(article: Article, index: number) {
  const source = article.externalUrl ? article.author : 'BDL Newsroom'
  const url = `/article/${article.slug}`
  const when = new Date(article.publishedAt).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const summary = article.dek?.trim() || article.content?.slice(0, 220).trim() || ''
  return [
    `${index}. [${article.category}] ${article.title}`,
    `   Source: ${source} | Published: ${when}`,
    summary ? `   Summary: ${summary}` : '',
    `   Link: ${url}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function dedupeStories(articles: Article[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    if (!article.title?.trim() || seen.has(article.slug)) return false
    seen.add(article.slug)
    return true
  })
}

export async function buildSonkeNewsBriefing() {
  const [wire, own, live, trending] = await Promise.all([
    getLatestWireArticles(40).catch(() => [] as Article[]),
    getPublishedArticles(15).catch(() => [] as Article[]),
    getLiveUpdates(10).catch(() => []),
    getTrendingArticles('trending', 10).catch(() => [] as Article[]),
  ])

  const stories = dedupeStories([...own, ...wire, ...trending]).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  const lines = [
    `BDL News live briefing — ${siteConfig.name} (${siteConfig.url})`,
    `Generated: ${new Date().toISOString()}`,
    `Stories in feed: ${stories.length} (${own.length} editorial, ${wire.length} wire)`,
    '',
    '### Headlines (newest first)',
  ]

  if (stories.length) {
    lines.push(...stories.slice(0, 30).map((article, index) => formatStory(article, index + 1)))
  } else {
    lines.push('No stories loaded in this refresh — check wire API keys and syndicated cache.')
  }

  if (live.length) {
    lines.push('', '### Live wire ticker')
    live.forEach((item, index) => {
      lines.push(`${index + 1}. [${item.category}] ${item.headline} (${item.status}, ${item.time})`)
    })
  }

  const categoryCounts = new Map<string, number>()
  for (const article of stories) {
    categoryCounts.set(article.category, (categoryCounts.get(article.category) ?? 0) + 1)
  }

  if (categoryCounts.size) {
    lines.push('', '### Categories in feed')
    for (const [category, count] of [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${category}: ${count} stories`)
    }
  }

  return lines.join('\n')
}
