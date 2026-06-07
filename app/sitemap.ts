import type { MetadataRoute } from 'next'
import { NAV_LINKS, SITE_LINKS } from '@/lib/data'
import { getAuthorDirectory, getPublishedArticles } from '@/lib/news'
import { absoluteUrl } from '@/lib/site'

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, authors] = await Promise.all([
    getPublishedArticles(1000),
    getAuthorDirectory(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'hourly', priority: 1 },
    ...SITE_LINKS.map((link) => ({
      url: absoluteUrl(link.href),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...NAV_LINKS.filter((item) => item !== 'Home').map((category) => ({
      url: absoluteUrl(`/category/${slugify(category)}`),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    })),
  ]

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/article/${article.slug}`),
    lastModified: new Date(article.updatedAt ?? article.publishedAt),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const authorPages: MetadataRoute.Sitemap = authors.map((author) => ({
    url: absoluteUrl(`/author/${author.id}`),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...articlePages, ...authorPages]
}
