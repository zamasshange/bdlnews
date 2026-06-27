import 'server-only'

import type { Article, Category } from '@/lib/data'
import { extractOgImageFromUrl } from '@/lib/article-extractor'

const CATEGORY_STOCK: Partial<Record<Category, string>> = {
  World: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80',
  Politics: 'https://images.unsplash.com/photo-1529107386315-e1a2cc820af8?auto=format&fit=crop&w=1400&q=80',
  Business: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80',
  Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ca5781?auto=format&fit=crop&w=1400&q=80',
  Entertainment: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=80',
  Africa: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80',
  Opinion: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80',
  'AI News': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
}

export function hasRealImage(image?: string | null) {
  if (!image?.trim()) return false
  if (image.includes('placeholder')) return false
  if (image.includes('picsum.photos')) return false
  if (Object.values(CATEGORY_STOCK).some((stock) => stock === image)) return false
  return true
}

/** Unique per-article fallback when no OG/thumbnail is available. */
export function categoryFallbackImage(_category: Category, seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1400/900`
}

async function fetchOgImageWithTimeout(url: string, ms = 5000) {
  try {
    return await Promise.race([
      extractOgImageFromUrl(url),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ])
  } catch {
    return null
  }
}

export async function ensureArticleImage(article: Article): Promise<Article> {
  if (hasRealImage(article.image)) return article

  if (article.externalUrl) {
    const ogImage = await fetchOgImageWithTimeout(article.externalUrl)
    if (ogImage && hasRealImage(ogImage)) {
      return { ...article, image: ogImage, imageCredit: article.imageCredit || article.author }
    }
  }

  return {
    ...article,
    image: categoryFallbackImage(article.category, article.slug),
  }
}

async function mapInBatches<T, R>(items: T[], batchSize: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(mapper))
    results.push(...batchResults)
  }
  return results
}

export async function ensureArticleImages(articles: Article[], limit = 40) {
  const targets = articles.slice(0, limit)
  const rest = articles.slice(limit)

  const enriched = await mapInBatches(targets, 6, async (article) => {
    if (hasRealImage(article.image)) return article
    return ensureArticleImage(article)
  })

  return [
    ...enriched,
    ...rest.map((article) =>
      hasRealImage(article.image)
        ? article
        : { ...article, image: categoryFallbackImage(article.category, article.slug) },
    ),
  ]
}
