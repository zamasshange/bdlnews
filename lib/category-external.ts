import 'server-only'

import type { Category } from '@/lib/data'
import { NAV_LINKS } from '@/lib/data'

export type CategoryFetchConfig = {
  label: Category
  newsdataCategory?: string
  newsdataCountry?: string
  gnewsTopic?: string
  mediastackCategory?: string
  searchTerms: string[]
}

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export const CATEGORY_FETCH: Record<string, CategoryFetchConfig> = {
  world: {
    label: 'World',
    newsdataCategory: 'world',
    gnewsTopic: 'world',
    mediastackCategory: 'general',
    searchTerms: ['world news', 'international'],
  },
  politics: {
    label: 'Politics',
    newsdataCategory: 'politics',
    gnewsTopic: 'nation',
    searchTerms: ['politics', 'government', 'election'],
  },
  business: {
    label: 'Business',
    newsdataCategory: 'business',
    gnewsTopic: 'business',
    mediastackCategory: 'business',
    searchTerms: ['business', 'economy', 'markets'],
  },
  technology: {
    label: 'Technology',
    newsdataCategory: 'technology',
    gnewsTopic: 'technology',
    mediastackCategory: 'technology',
    searchTerms: ['technology', 'tech', 'innovation'],
  },
  sports: {
    label: 'Sports',
    newsdataCategory: 'sports',
    gnewsTopic: 'sports',
    mediastackCategory: 'sports',
    searchTerms: ['sports', 'football', 'cricket', 'rugby'],
  },
  entertainment: {
    label: 'Entertainment',
    newsdataCategory: 'entertainment',
    gnewsTopic: 'entertainment',
    mediastackCategory: 'entertainment',
    searchTerms: ['entertainment', 'celebrity', 'music', 'film'],
  },
  africa: {
    label: 'Africa',
    newsdataCountry: 'za,ng,ke,gh,eg,ma,tz,ug,zw',
    searchTerms: ['africa', 'african', 'south africa', 'nigeria', 'kenya'],
  },
  opinion: {
    label: 'Opinion',
    searchTerms: ['opinion', 'editorial', 'commentary', 'analysis'],
  },
  'ai-news': {
    label: 'AI News',
    searchTerms: ['artificial intelligence', 'AI news', 'machine learning', 'OpenAI'],
  },
}

export function categoryLabelFromSlug(slug: string): Category | undefined {
  const config = CATEGORY_FETCH[slug]
  if (config) return config.label
  return NAV_LINKS.find((item) => slugify(item) === slug) as Category | undefined
}

export function getCategoryFetchConfig(slug: string): CategoryFetchConfig | undefined {
  return CATEGORY_FETCH[slug]
}

export function articleMatchesCategorySlug(
  slug: string,
  article: { category?: string | null; title?: string; dek?: string; region?: string },
) {
  const config = CATEGORY_FETCH[slug]
  if (!config) return slugify(article.category ?? '') === slug

  if (slugify(article.category ?? '') === slug) return true
  if (slugify(config.label) === slug) return true

  const haystack = `${article.title ?? ''} ${article.dek ?? ''} ${article.region ?? ''}`.toLowerCase()
  return config.searchTerms.some((term) => haystack.includes(term.toLowerCase()))
}
