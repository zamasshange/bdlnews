import { getIndexableArticles } from '@/lib/seo-index'
import { absoluteUrl, siteConfig } from '@/lib/site'
import { truncateMetaDescription } from '@/lib/seo'

export async function GET() {
  const articles = (await getIndexableArticles(120)).slice(0, 80)
  const feedUrl = absoluteUrl('/rss.xml')

  const items = articles
    .map((article) => {
      const url = absoluteUrl(`/article/${article.slug}`)
      const description = truncateMetaDescription(article.seoDescription ?? article.dek ?? article.title)
      return `
        <item>
          <title><![CDATA[${article.title}]]></title>
          <description><![CDATA[${description}]]></description>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
          <category><![CDATA[${article.category}]]></category>
          <author>${article.author} (${siteConfig.email})</author>
        </item>`
    })
    .join('')

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title>${siteConfig.name}</title>
          <link>${siteConfig.url}</link>
          <description>${siteConfig.description}</description>
          <language>${siteConfig.language}</language>
          <copyright>© ${new Date().getFullYear()} ${siteConfig.legalName}</copyright>
          <managingEditor>${siteConfig.email} (${siteConfig.founder.name})</managingEditor>
          <webMaster>${siteConfig.email} (${siteConfig.founder.name})</webMaster>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
          ${items}
        </channel>
      </rss>`,
    {
      headers: {
        'content-type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    },
  )
}
