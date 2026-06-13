import { getIndexableArticles, getRecentNewsSitemapArticles } from '@/lib/seo-index'
import { absoluteUrl, siteConfig } from '@/lib/site'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const articles = await getIndexableArticles(1000)
  const newsArticles = getRecentNewsSitemapArticles(articles, 48)

  const items = newsArticles
    .map((article) => {
      const loc = absoluteUrl(`/article/${article.slug}`)
      const pubDate = new Date(article.publishedAt).toISOString()
      const keywords = [article.category, ...(article.tags ?? []), siteConfig.name].filter(Boolean).join(', ')
      return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>${siteConfig.language}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${escapeXml(keywords)}</news:keywords>
    </news:news>
  </url>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  })
}
