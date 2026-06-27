import 'server-only'

import type { Article } from '@/lib/data'
import { ensureArticleImages } from '@/lib/feed-images'
import { persistSyndicatedArticles } from '@/lib/syndicated-cache'

const KEEP_READING_COUNT = 6
const KEEP_READING_MIN = 3
/** Own articles younger than this get a ranking boost (not a permanent slot). */
const FRESH_OWN_WINDOW_MS = 48 * 60 * 60 * 1000
/** Virtual freshness added to recent BDL originals when sorting the feed. */
const OWN_RANK_BOOST_MS = 18 * 60 * 60 * 1000

export type HomeFeed = {
  featured: Article
  secondFeature: Article
  featureTwo: Article
  sideStories: Article[]
  gridStories: Article[]
  resources: Article[]
  keepReadingStories: Article[]
  remainingStories: Article[]
  wireHighlights: Article[]
  spotlightStories: Article[]
  trendingTopics: string[]
  mode: 'editorial' | 'wire' | 'mixed'
  stats: {
    ownCount: number
    wireCount: number
    recentOwnCount: number
  }
}

async function enrichDisplayed(articles: Article[]) {
  const unique = dedupe(articles)
  const enriched = await ensureArticleImages(unique, unique.length)
  const bySlug = new Map(enriched.map((article) => [article.slug, article]))
  return (article: Article) => bySlug.get(article.slug) ?? article
}

function sortByDate(articles: Article[]) {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

function isOwn(article: Article) {
  return !article.externalUrl
}

function isFreshOwn(article: Article) {
  if (!isOwn(article)) return false
  return Date.now() - new Date(article.publishedAt).getTime() <= FRESH_OWN_WINDOW_MS
}

/** Higher score = appears earlier on the homepage. */
function homeRank(article: Article) {
  const published = new Date(article.publishedAt).getTime()
  if (isFreshOwn(article)) {
    return published + OWN_RANK_BOOST_MS
  }
  return published
}

function sortForHomepage(articles: Article[]) {
  return dedupe(articles).sort((a, b) => homeRank(b) - homeRank(a))
}

function dedupe(articles: Article[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    const key = article.slug
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function takeUnique(pool: Article[], used: Set<string>, count: number) {
  const picked: Article[] = []
  for (const article of pool) {
    if (used.has(article.slug)) continue
    used.add(article.slug)
    picked.push(article)
    if (picked.length >= count) break
  }
  return picked
}

function resolveMode(recentOwnCount: number, topStories: Article[]) {
  const freshOwnInTop = topStories.filter(isFreshOwn).length
  if (recentOwnCount === 0) return 'wire'
  if (freshOwnInTop >= 3) return 'editorial'
  return 'mixed'
}

export async function buildHomeFeed(
  ownArticles: Article[],
  externalArticles: Article[],
  trendingArticles: Article[],
): Promise<HomeFeed> {
  const own = sortByDate(ownArticles)
  const external = sortByDate(await ensureArticleImages(externalArticles, 28))
  const recentOwn = own.filter(isFreshOwn)
  const masterFeed = sortForHomepage([...own, ...external])

  if (!masterFeed.length) {
    const now = new Date().toISOString()
    const placeholder: Article = {
      slug: 'no-stories-yet',
      title: 'BDL News is warming up',
      dek: 'No stories are available yet. Connect your wire sources or publish your first article from the admin desk.',
      category: 'World',
      image: '/placeholder.jpg',
      author: 'BDL Newsroom',
      authorRole: 'Staff',
      readingTime: 1,
      publishedAt: now,
      updatedAt: now,
      region: 'Global',
      readers: 0,
      comments: 0,
      shares: 0,
      engagement: 0,
      sentiment: 'neutral',
      trendDelta: 0,
    }

    return {
      featured: placeholder,
      secondFeature: placeholder,
      featureTwo: placeholder,
      sideStories: [],
      gridStories: [],
      resources: [],
      keepReadingStories: [],
      remainingStories: [],
      wireHighlights: [],
      spotlightStories: [],
      trendingTopics: [],
      mode: 'wire',
      stats: {
        ownCount: 0,
        wireCount: 0,
        recentOwnCount: 0,
      },
    }
  }

  const used = new Set<string>()
  const featured = masterFeed[0]
  used.add(featured.slug)
  const secondFeature = takeUnique(masterFeed, used, 1)[0] ?? featured
  const featureTwo = takeUnique(masterFeed, used, 1)[0] ?? secondFeature

  const sideStories = takeUnique(masterFeed, used, 4)
  const gridStories = takeUnique(masterFeed, used, 4)
  const resources = takeUnique(masterFeed, used, 3)

  const keepReadingStories = takeUnique(masterFeed, used, KEEP_READING_COUNT)
  if (keepReadingStories.length < KEEP_READING_MIN) {
    for (const article of external) {
      if (used.has(article.slug)) continue
      keepReadingStories.push(article)
      used.add(article.slug)
      if (keepReadingStories.length >= KEEP_READING_MIN) break
    }
  }

  const remainingStories = masterFeed.filter((article) => !used.has(article.slug))

  const topStories = [featured, secondFeature, featureTwo, ...sideStories]
  const mode = resolveMode(recentOwn.length, topStories)

  const trendingTopics = trendingArticles.length
    ? trendingArticles.map((article) => article.title)
    : masterFeed.slice(0, 8).map((article) => article.title)

  const wireHighlights = external.slice(0, 6)
  const spotlightStories = takeUnique(masterFeed, new Set(used), 3)

  const pick = await enrichDisplayed([
    featured,
    secondFeature,
    featureTwo,
    ...sideStories,
    ...gridStories,
    ...resources,
    ...keepReadingStories,
    ...remainingStories.slice(0, 12),
    ...wireHighlights,
    ...spotlightStories,
  ])

  const surfaced = [
    pick(featured),
    pick(secondFeature),
    pick(featureTwo),
    ...sideStories.map(pick),
    ...gridStories.map(pick),
    ...resources.map(pick),
    ...keepReadingStories.map(pick),
    ...remainingStories.slice(0, 12).map(pick),
    ...wireHighlights.map(pick),
    ...spotlightStories.map(pick),
  ]
  await persistSyndicatedArticles(surfaced)

  return {
    featured: pick(featured),
    secondFeature: pick(secondFeature),
    featureTwo: pick(featureTwo),
    sideStories: sideStories.map(pick),
    gridStories: gridStories.map(pick),
    resources: resources.map(pick),
    keepReadingStories: keepReadingStories.map(pick),
    remainingStories: remainingStories.map(pick),
    wireHighlights: wireHighlights.map(pick),
    spotlightStories: spotlightStories.map(pick),
    trendingTopics,
    mode,
    stats: {
      ownCount: own.length,
      wireCount: external.length,
      recentOwnCount: recentOwn.length,
    },
  }
}

export async function buildExternalOnlyFeed(
  externalArticles: Article[],
  trendingArticles: Article[],
): Promise<HomeFeed> {
  return buildHomeFeed([], externalArticles, trendingArticles)
}
