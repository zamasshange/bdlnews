import { NextResponse } from 'next/server'
import { fetchExternalNews, type ExternalNewsItem, type ExternalNewsProvider } from '@/lib/external-news'
import { getCachedSyndicatedArticles } from '@/lib/syndicated-cache'

function cachedAsExternalNews(articles: Awaited<ReturnType<typeof getCachedSyndicatedArticles>>): ExternalNewsItem[] {
  return articles.map((article) => ({
    provider: 'newsdata',
    title: article.title,
    description: article.dek,
    content: article.content,
    url: article.externalUrl ?? article.slug,
    imageUrl: article.image?.startsWith('http') ? article.image : null,
    source: article.author,
    publishedAt: article.publishedAt,
    category: article.category,
    country: article.region !== 'Global' ? article.region : null,
  }))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const provider = (url.searchParams.get('provider') ?? 'newsdata') as ExternalNewsProvider | 'all'
  const query = url.searchParams.get('q') ?? undefined

  try {
    const articles = await fetchExternalNews({ provider, query })
    if (articles.length) {
      return NextResponse.json({ articles })
    }
  } catch {
    // Fall through to cached syndicated stories.
  }

  const cached = cachedAsExternalNews(await getCachedSyndicatedArticles(50))
  if (cached.length) {
    return NextResponse.json({ articles: cached, cached: true })
  }

  return NextResponse.json(
    { error: 'Unable to fetch external news and no cached stories are available.' },
    { status: 502 },
  )
}
