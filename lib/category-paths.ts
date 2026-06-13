import { NAV_LINKS } from '@/lib/data'

export function slugifyCategory(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export const CATEGORY_NAV_ITEMS = NAV_LINKS.filter((item) => item !== 'Home')

export const CATEGORY_SLUGS = CATEGORY_NAV_ITEMS.map(slugifyCategory)

export function isCategorySlug(slug: string) {
  return CATEGORY_SLUGS.includes(slug)
}

export function categoryPath(slug: string) {
  return `/${slug}`
}

export function categoryPathFromName(name: string) {
  return categoryPath(slugifyCategory(name))
}

export function categoryTitleFromSlug(slug: string) {
  return CATEGORY_NAV_ITEMS.find((category) => slugifyCategory(category) === slug)
}
