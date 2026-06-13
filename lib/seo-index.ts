import 'server-only'

import type { Article } from '@/lib/data'
import { NAV_LINKS, SITE_LINKS } from '@/lib/data'
import { slugifyCategory } from '@/lib/category-paths'
import { getPublishedArticles } from '@/lib/news'
import { getCachedSyndicatedArticles } from '@/lib/syndicated-cache'
import { absoluteUrl } from '@/lib/site'

function slugify(value: string) {
  return slugifyCategory(value)
}

function dedupeArticles(articles: Article[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    if (!article.slug || seen.has(article.slug)) return false
    seen.add(article.slug)
    return Boolean(article.title)
  })
}

export async function getIndexableArticles(limit = 1500): Promise<Article[]> {
  const [own, syndicated] = await Promise.all([
    getPublishedArticles(limit),
    getCachedSyndicatedArticles(500),
  ])

  return dedupeArticles([...own, ...syndicated]).slice(0, limit)
}

export function getStaticIndexRoutes() {
  const routes = [
    { path: '/', priority: 1, changeFrequency: 'hourly' as const },
    { path: '/news', priority: 0.95, changeFrequency: 'hourly' as const },
    ...SITE_LINKS.map((link) => ({
      path: link.href,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    })),
    ...NAV_LINKS.filter((item) => item !== 'Home').map((category) => ({
      path: `/${slugify(category)}`,
      priority: 0.92,
      changeFrequency: 'hourly' as const,
    })),
  ]

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    priority: route.priority,
    changeFrequency: route.changeFrequency,
  }))
}

export function getRecentNewsSitemapArticles(articles: Article[], maxAgeHours = 48) {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000
  const recent = articles.filter((article) => new Date(article.publishedAt).getTime() >= cutoff)
  return recent.length ? recent : articles.slice(0, 150)
}
