import type { Article } from '@/lib/data'
import {
  contentNeedsTwitterEnhancement,
  extractArticleBodyFromUrl,
  looksTruncated,
} from '@/lib/article-extractor'
import {
  countResolvableTwitterLinks,
  mergeExtractedTweetUrls,
} from '@/lib/social-embeds'
import { buildWireImageCaption } from '@/lib/article-extractor'
import { getSyndicatedRecord, persistSyndicatedArticles } from '@/lib/syndicated-cache'

function wordCount(content?: string | null) {
  return (content ?? '').split(/\s+/).filter(Boolean).length
}

function recentlyEnriched(enrichedAt?: string) {
  if (!enrichedAt) return false
  return Date.now() - new Date(enrichedAt).getTime() < 1000 * 60 * 60 * 12
}

export async function enrichSyndicatedArticle(article: Article): Promise<Article> {
  if (!article.externalUrl) return article

  try {
    const record = await getSyndicatedRecord(article.slug)
    let content = article.content ?? article.dek ?? ''
    let imageCredit = article.imageCredit
    const words = wordCount(content)
    const complete = words >= 180 && !looksTruncated(content)

    if (complete && recentlyEnriched(record?.enrichedAt)) {
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
    const shouldExtractFromSource = looksTruncated(content) || needsTwitterEnhancement

    if (shouldExtractFromSource) {
      const extracted = await extractArticleBodyFromUrl(article.externalUrl)
      if (extracted?.content) {
        imageCredit = imageCredit || extracted.imageCredit

        if (looksTruncated(content)) {
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
      content,
      dek: article.dek || content.split(/\n{2,}/)[0]?.slice(0, 280) || article.title,
      imageCredit: imageCredit || article.author,
      readingTime: Math.max(3, Math.ceil(wordCount(content) / 220)),
    }

    if (looksTruncated(enriched.content)) {
      enriched.content = [
        enriched.dek,
        '',
        'This story continues on the original publisher. Use the link below to read the full reporting from the source newsroom.',
      ].join('\n')
    }

    await persistSyndicatedArticles([enriched], true)
    return enriched
  } catch {
    return article
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
