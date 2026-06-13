import type { Article } from '@/lib/data'
import {
  buildWireImageCaption,
  contentNeedsTwitterEnhancement,
  extractArticleBodyFromUrl,
  isPersistedStubContent,
  isSyndicatedContentComplete,
  looksTruncated,
  needsSyndicatedBodyFetch,
  syndicatedWordCount,
} from '@/lib/article-extractor'
import {
  countResolvableTwitterLinks,
  mergeExtractedTweetUrls,
} from '@/lib/social-embeds'
import { cleanWireExcerpt } from '@/lib/syndicated-content'
import { getSyndicatedRecord, persistSyndicatedArticles } from '@/lib/syndicated-cache'

function recentlyEnriched(enrichedAt?: string) {
  if (!enrichedAt) return false
  return Date.now() - new Date(enrichedAt).getTime() < 1000 * 60 * 60 * 12
}

function startingContent(article: Article) {
  if (isPersistedStubContent(article.content)) {
    return cleanWireExcerpt(article.dek) || cleanWireExcerpt(article.content) || ''
  }
  return cleanWireExcerpt(article.content) || cleanWireExcerpt(article.dek) || ''
}

export async function enrichSyndicatedArticle(article: Article): Promise<Article> {
  if (!article.externalUrl) return article

  try {
    const record = await getSyndicatedRecord(article.slug)
    let content = startingContent(article)
    let imageCredit = article.imageCredit
    const words = syndicatedWordCount(content)
    const complete = isSyndicatedContentComplete(content) && !isPersistedStubContent(article.content)

    if (complete && recentlyEnriched(record?.enrichedAt) && !contentNeedsTwitterEnhancement(content)) {
      return {
        ...article,
        content,
        dek: article.dek || content.split(/\n{2,}/)[0]?.slice(0, 280) || article.title,
        readingTime: Math.max(3, Math.ceil(words / 220)),
      }
    }

    if (complete && !contentNeedsTwitterEnhancement(content)) {
      return {
        ...article,
        content,
        dek: article.dek || content.split(/\n{2,}/)[0]?.slice(0, 280) || article.title,
        readingTime: Math.max(3, Math.ceil(words / 220)),
      }
    }

    const needsTwitterEnhancement = contentNeedsTwitterEnhancement(content)
    const shouldExtractFromSource = needsSyndicatedBodyFetch(article.content) || needsSyndicatedBodyFetch(content) || needsTwitterEnhancement

    if (shouldExtractFromSource) {
      const extracted = await extractArticleBodyFromUrl(article.externalUrl)
      if (extracted?.content) {
        imageCredit = imageCredit || extracted.imageCredit

        if (needsSyndicatedBodyFetch(article.content) || needsSyndicatedBodyFetch(content) || looksTruncated(content)) {
          content = extracted.content
        } else if (needsTwitterEnhancement) {
          const extractedTweetCount =
            countResolvableTwitterLinks(extracted.content) + (extracted.tweetUrls?.length ?? 0)
          if (extractedTweetCount > 0 && extracted.content.length >= content.length * 0.5) {
            content = extracted.content
          } else {
            content = mergeExtractedTweetUrls(content, extracted.content)
          }
        }

        if (countResolvableTwitterLinks(content) === 0 && extracted.tweetUrls?.length) {
          content = `${content}\n\n${extracted.tweetUrls.join('\n\n')}`
        }
      }
    }

    const enriched: Article = {
      ...article,
      content: content.trim() || cleanWireExcerpt(article.dek) || article.title,
      dek: article.dek || content.split(/\n{2,}/)[0]?.slice(0, 280) || article.title,
      imageCredit: imageCredit || article.author,
      readingTime: Math.max(3, Math.ceil(syndicatedWordCount(content) / 220)),
    }

    const enrichedSuccessfully = isSyndicatedContentComplete(enriched.content)
    await persistSyndicatedArticles([enriched], enrichedSuccessfully)
    return enriched
  } catch {
    return article
  }
}

export async function enrichSyndicatedArticleFast(article: Article, timeoutMs = 12000): Promise<Article> {
  if (!article.externalUrl || !needsSyndicatedBodyFetch(article.content)) {
    return article
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      enrichSyndicatedArticle(article),
      new Promise<Article>((resolve) => {
        timer = setTimeout(() => resolve(article), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function wireHeroCaption(article: Article) {
  return buildWireImageCaption({
    title: article.title,
    dek: article.dek,
    author: article.author,
    imageCredit: article.imageCredit,
  })
}
