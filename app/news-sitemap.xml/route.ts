import { getPublishedArticles } from '@/lib/news'
import { absoluteUrl, siteConfig } from '@/lib/site'

export async function GET() {
  const articles = await getPublishedArticles(1000)
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000

  const recentArticles = articles.filter(
    (article) => new Date(article.publishedAt).getTime() >= twoDaysAgo,
  )

  const items = (recentArticles.length ? recentArticles : articles.slice(0, 100))
    .map((article) => {
      const loc = absoluteUrl(`/article/${article.slug}`)
      const pubDate = new Date(article.publishedAt).toISOString()
      return `
  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${siteConfig.name}</news:name>
        <news:language>${siteConfig.language}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${article.title}]]></news:title>
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
