import { NextResponse } from 'next/server'
import { getWireArticleBySlug } from '@/lib/news'
import { isGarbageArticleContent, isSyndicatedContentComplete } from '@/lib/syndicated-content'
import { enrichSyndicatedArticle } from '@/lib/syndicated-enrich'
import { persistSyndicatedArticles } from '@/lib/syndicated-cache'

export const maxDuration = 60

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const base = await getWireArticleBySlug(slug)
  if (!base?.externalUrl) {
    return NextResponse.json({ error: 'article not found' }, { status: 404 })
  }

  let article = base
  if (!isSyndicatedContentComplete(article.content) || isGarbageArticleContent(article.content)) {
    article = await enrichSyndicatedArticle({
      ...base,
      content: isGarbageArticleContent(base.content) ? '' : base.content,
    })
    await persistSyndicatedArticles([article], isSyndicatedContentComplete(article.content))
  }

  const complete = isSyndicatedContentComplete(article.content) && !isGarbageArticleContent(article.content)

  return NextResponse.json({
    content: article.content ?? '',
    complete,
  })
}
