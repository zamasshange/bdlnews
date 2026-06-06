import { getPublishedArticles } from '@/lib/news'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const articles = await getPublishedArticles(50)
  const items = articles
    .map((article) => {
      const url = `${origin}/article/${article.slug}`
      return `
        <item>
          <title><![CDATA[${article.title}]]></title>
          <description><![CDATA[${article.dek}]]></description>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
          <category><![CDATA[${article.category}]]></category>
        </item>`
    })
    .join('')

  return new Response(
    `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>BDL News</title>
          <link>${origin}</link>
          <description>Latest BDL News stories</description>
          ${items}
        </channel>
      </rss>`,
    { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } },
  )
}
