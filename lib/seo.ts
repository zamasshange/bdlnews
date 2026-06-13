import type { Metadata } from 'next'
import type { Article } from '@/lib/data'
import { bdlSignalBranding, BDL_SIGNAL_SLUG } from '@/lib/category-branding'
import { categoryPath } from '@/lib/category-paths'
import { categorySearchKeywords, coreSearchKeywords } from '@/lib/seo-keywords'
import { absoluteUrl, siteConfig } from '@/lib/site'

function resolveImageUrl(image?: string) {
  if (!image) return absoluteUrl(siteConfig.defaultOgImage)
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return absoluteUrl(image)
}

export function truncateMetaDescription(text: string, max = 160) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  const truncated = cleaned.slice(0, max - 1)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${(lastSpace > 120 ? truncated.slice(0, lastSpace) : truncated).trim()}…`
}

type PageMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  noIndex?: boolean
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path)
  const metaDescription = truncateMetaDescription(description)
  const image = resolveImageUrl(ogImage)
  const mergedKeywords = [...new Set([...coreSearchKeywords, ...siteConfig.keywords.slice(0, 12), ...keywords])]

  return {
    title,
    description: metaDescription,
    keywords: mergedKeywords,
    authors: authors?.map((name) => ({ name })),
    creator: siteConfig.founder.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    alternates: {
      canonical,
      types: {
        'application/rss+xml': [{ url: absoluteUrl('/rss.xml'), title: `${siteConfig.name} RSS` }],
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_SITE_VERIFICATION,
      other: process.env.BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
        : undefined,
    },
    openGraph: {
      title,
      description: metaDescription,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: [image],
      creator: siteConfig.social.twitter,
      site: siteConfig.social.twitter,
    },
    category: 'news',
  }
}

export function buildArticleMetadata(article: Article): Metadata {
  const title = article.seoTitle ?? article.title
  const description =
    article.seoDescription ?? article.dek ?? `Read ${article.title} on BDL News — breaking news and current affairs from South Africa, Africa, and the world.`

  return buildPageMetadata({
    title,
    description,
    path: `/article/${article.slug}`,
    keywords: [
      ...(article.tags ?? []),
      article.category,
      `${article.category} News`,
      'Latest News',
      'Breaking News',
    ],
    ogImage: article.image,
    type: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt ?? article.publishedAt,
    authors: [article.author],
  })
}

const publisherBase = {
  name: siteConfig.name,
  alternateName: siteConfig.organization.alternateName,
  url: siteConfig.url,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl(siteConfig.defaultOgImage),
  },
  parentOrganization: {
    '@type': 'Organization',
    name: siteConfig.organization.parentOrganization.name,
    alternateName: siteConfig.organization.parentOrganization.alternateName,
    url: siteConfig.organization.parentOrganization.url,
  },
  foundingDate: '2024',
  founder: { '@type': 'Person', name: siteConfig.founder.name },
  email: siteConfig.email,
  telephone: siteConfig.phone,
  areaServed: siteConfig.organization.areaServed,
  knowsAbout: siteConfig.organization.knowsAbout,
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'NewsMediaOrganization'],
    ...publisherBase,
    description: siteConfig.description,
    sameAs: siteConfig.founder.sameAs,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: [...siteConfig.organization.alternateName, siteConfig.domain],
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { '@type': 'NewsMediaOrganization', name: siteConfig.name, url: siteConfig.url },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/news')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function categoryCollectionJsonLd(
  slug: string,
  name: string,
  description: string,
  articles: Pick<Article, 'slug' | 'title' | 'publishedAt'>[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} News | ${siteConfig.name}`,
    description,
    url: absoluteUrl(categoryPath(slug)),
    inLanguage: siteConfig.language,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    about: {
      '@type': 'Thing',
      name: `${name} News`,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.slice(0, 20).map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/article/${article.slug}`),
        name: article.title,
      })),
    },
  }
}

export function homepageItemListJsonLd(articles: Pick<Article, 'slug' | 'title' | 'publishedAt' | 'category'>[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Latest headlines from ${siteConfig.name}`,
    url: siteConfig.url,
    itemListElement: articles.slice(0, 12).map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/article/${article.slug}`),
      name: article.title,
    })),
  }
}

export function founderJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.founder.name,
    jobTitle: siteConfig.founder.jobTitle,
    description: siteConfig.founder.description,
    nationality: siteConfig.founder.nationality,
    url: absoluteUrl(`/author/${siteConfig.founder.slug}`),
    sameAs: siteConfig.founder.sameAs,
    worksFor: {
      '@type': 'NewsMediaOrganization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    founderOf: [
      { '@type': 'NewsMediaOrganization', name: siteConfig.name, url: siteConfig.url },
      { '@type': 'Organization', name: siteConfig.organization.parentOrganization.name, url: siteConfig.organization.parentOrganization.url },
    ],
  }
}

export function newsArticleJsonLd(article: Article) {
  const imageSource = article.image || siteConfig.defaultOgImage
  const image = imageSource.startsWith('http') ? imageSource : absoluteUrl(imageSource)
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: truncateMetaDescription(article.seoDescription ?? article.dek ?? article.title),
    image: [image],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
      ...(article.authorId ? { url: absoluteUrl(`/author/${article.authorId}`) } : {}),
    },
    publisher: { '@type': 'NewsMediaOrganization', ...publisherBase },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/article/${article.slug}`),
    },
    articleSection: article.category,
    keywords: (article.tags ?? []).join(', '),
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    ...(article.externalUrl
      ? {
          isBasedOn: {
            '@type': 'CreativeWork',
            url: article.externalUrl,
          },
        }
      : {}),
  }
}

export function personJsonLd(author: {
  name: string
  bio?: string
  role?: string
  id: string
  profileImage?: string
  socialLinks?: { x?: string; linkedin?: string; website?: string }
}) {
  const sameAs = [author.socialLinks?.x, author.socialLinks?.linkedin, author.socialLinks?.website].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    description: author.bio,
    jobTitle: author.role,
    url: absoluteUrl(`/author/${author.id}`),
    image: author.profileImage ? absoluteUrl(author.profileImage) : undefined,
    sameAs,
    worksFor: { '@type': 'NewsMediaOrganization', name: siteConfig.name, url: siteConfig.url },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function categoryMetadata(slug: string, name: string): Metadata {
  const descriptions: Record<string, string> = {
    world: 'Latest world news, international headlines, and global current affairs on BDL News Online (bdlnews.online).',
    politics: 'Politics news, policy updates, and government coverage on BDL News Online — breaking political headlines from South Africa, Africa, and the world.',
    business: 'Business news, markets, economy, and corporate coverage on BDL News Online — trusted financial and industry reporting.',
    technology: 'Technology news, AI updates, startups, and digital innovation on BDL News Online — including ChatGPT, OpenAI, Gemini AI, and emerging tech.',
    sports: 'Sports news, live updates, and match coverage on BDL News Online — latest headlines from South Africa, Africa, and global sport.',
    entertainment: 'Entertainment news, culture, and trending stories on BDL News Online — film, music, and celebrity coverage.',
    africa: 'African news, regional headlines, and continental current affairs on BDL News Online — independent reporting across Africa.',
    opinion: 'Opinion and analysis on the biggest stories from BDL News Online — expert commentary on politics, business, technology, and culture.',
    'ai-news': bdlSignalBranding.description,
  }

  const categoryKeywords: Record<string, string[]> = {
    world: categorySearchKeywords.world,
    politics: categorySearchKeywords.politics,
    business: categorySearchKeywords.business,
    technology: categorySearchKeywords.technology,
    sports: categorySearchKeywords.sports,
    entertainment: categorySearchKeywords.entertainment,
    africa: categorySearchKeywords.africa,
    opinion: categorySearchKeywords.opinion,
    'ai-news': [...bdlSignalBranding.seoKeywords, ...coreSearchKeywords.slice(0, 6)],
  }

  if (slug === BDL_SIGNAL_SLUG) {
    return buildPageMetadata({
      title: bdlSignalBranding.title,
      description: bdlSignalBranding.description,
      path: categoryPath(slug),
      keywords: [...bdlSignalBranding.seoKeywords, ...coreSearchKeywords],
    })
  }

  return buildPageMetadata({
    title: `${name} News`,
    description: descriptions[slug] ?? `Latest ${name.toLowerCase()} news, headlines, and current affairs on BDL News Online (bdlnews.online).`,
    path: categoryPath(slug),
    keywords: [
      name,
      `${name} News`,
      ...coreSearchKeywords,
      ...(categoryKeywords[slug] ?? []),
    ],
  })
}
