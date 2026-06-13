import type { MetadataRoute } from 'next'
import { getAuthorDirectory } from '@/lib/news'
import { getIndexableArticles, getStaticIndexRoutes } from '@/lib/seo-index'
import { absoluteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, authors] = await Promise.all([getIndexableArticles(1500), getAuthorDirectory()])

  const staticPages: MetadataRoute.Sitemap = getStaticIndexRoutes().map((route) => ({
    url: route.url,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/article/${article.slug}`),
    lastModified: new Date(article.updatedAt ?? article.publishedAt),
    changeFrequency: 'daily',
    priority: article.externalUrl ? 0.65 : 0.75,
  }))

  const authorPages: MetadataRoute.Sitemap = authors.map((author) => ({
    url: absoluteUrl(`/author/${author.id}`),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...articlePages, ...authorPages]
}
