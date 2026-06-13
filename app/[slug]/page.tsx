import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { CategoryPageView } from '@/components/category/category-page-view'
import { SiteShell } from '@/components/site-shell'
import {
  CATEGORY_SLUGS,
  categoryPath,
  categoryTitleFromSlug,
  isCategorySlug,
} from '@/lib/category-paths'
import { getPublishedArticles, getCategoryBySlug } from '@/lib/news'
import { categoryMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const staticPages = {
  'about-us': {
    eyebrow: 'About BDL',
    title: 'News built for speed, context, and clarity.',
    body:
      'BDL News is a light, fast newsroom experience for readers who want the facts, the signal, and the wider context without getting buried in noise.',
  },
  news: {
    eyebrow: 'Latest News',
    title: 'Fresh reporting from across the desk.',
    body:
      'Browse the newest BDL stories across world affairs, business, technology, sport, culture, Africa coverage, and AI-assisted explainers.',
  },
  authors: {
    eyebrow: 'Authors',
    title: 'Meet the voices behind the coverage.',
    body:
      'Our correspondents combine original reporting, editorial judgment, and AI-supported research workflows to keep stories sharp and useful.',
  },
  podcast: {
    eyebrow: 'Podcast',
    title: 'Listen to the stories behind the headlines.',
    body:
      'BDL audio briefings turn the biggest stories into clear conversations, timelines, and quick explanations for readers on the move.',
  },
  'contact-us': {
    eyebrow: 'Contact',
    title: 'Send tips, questions, and partnership notes.',
    body:
      'Reach the BDL desk for corrections, story leads, editorial partnerships, and audience support.',
  },
} as const

type StaticPageSlug = keyof typeof staticPages

export function generateStaticParams() {
  return [
    ...CATEGORY_SLUGS.map((slug) => ({ slug })),
    ...Object.keys(staticPages).map((slug) => ({ slug })),
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (isCategorySlug(slug)) {
    const category = (await getCategoryBySlug(slug)) ?? { name: categoryTitleFromSlug(slug) }
    if (!category.name) return {}
    return categoryMetadata(slug, category.name)
  }

  const page = staticPages[slug as StaticPageSlug]
  if (!page) return {}

  return {
    title: `${page.eyebrow} | BDL News`,
    description: page.body,
  }
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (isCategorySlug(slug)) {
    return <CategoryPageView slug={slug} />
  }

  const page = staticPages[slug as StaticPageSlug]
  if (!page) notFound()
  const articles = await getPublishedArticles()

  return (
    <SiteShell showTicker>
      <section className="jox-container py-8 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary">{page.eyebrow}</p>
            <h1 className="max-w-5xl text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              {page.title}
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">{page.body}</p>
        </div>
      </section>

      <section className="jox-container grid gap-8 pb-14 lg:grid-cols-[0.32fr_1fr]">
        <div>
          <p className="mb-3 text-xs font-black uppercase text-primary">BDL Feed</p>
          <h2 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Stories To Open
          </h2>
          <Link
            href={categoryPath('ai-news')}
            className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase text-foreground transition hover:text-primary"
          >
            Explore AI News
            <ArrowUpRight className="size-4 text-primary" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
