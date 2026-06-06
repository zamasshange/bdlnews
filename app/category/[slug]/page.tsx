import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { SiteShell } from '@/components/site-shell'
import { NAV_LINKS } from '@/lib/data'
import { getArticlesByCategorySlug, getCategoryBySlug } from '@/lib/news'

export const dynamic = 'force-dynamic'

const categories = NAV_LINKS.filter((item) => item !== 'Home')

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

function titleFromSlug(slug: string) {
  return categories.find((category) => slugify(category) === slug)
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: slugify(category) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = (await getCategoryBySlug(slug)) ?? { name: titleFromSlug(slug) }
  if (!category.name) return {}

  return {
    title: `${category.name} | BDL News`,
    description: `Latest ${category.name.toLowerCase()} stories from BDL News.`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = (await getCategoryBySlug(slug)) ?? { name: titleFromSlug(slug) ?? 'Stories', slug }

  const shownArticles = await getArticlesByCategorySlug(slug)
  const lead = shownArticles[0]

  return (
    <SiteShell showTicker>
      <section className="jox-container py-8 md:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="grid gap-8 border-b border-border pb-8 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary">Category</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              {category.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A focused feed of BDL reporting, context, and AI-assisted signals across the
              latest {category.name.toLowerCase()} stories.
            </p>
          </div>

          <div className="border border-border bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-primary">
              <Sparkles className="size-4" />
              BDL Signal
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {shownArticles.length} stories tracked with live reader interest, source
              context, and editorial priority.
            </p>
          </div>
        </div>
      </section>

      <section className="jox-container grid gap-8 pb-12 lg:grid-cols-[0.9fr_1fr]">
        {shownArticles.length ? (
          <>
            <div className="story-link group block">
              <div className="relative aspect-[1.35] overflow-hidden bg-muted">
                <Image
                  src={lead.image}
                  alt={lead.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="story-image object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-3 text-xs font-black uppercase text-primary">
                Lead Story / {lead.readingTime} Min
              </p>
              <Link href={`/article/${lead.slug}`} className="group">
                <h2 className="text-4xl font-semibold leading-tight text-foreground transition group-hover:text-primary md:text-5xl">
                  {lead.title}
                </h2>
              </Link>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {lead.dek}
              </p>
              <Link
                href={`/article/${lead.slug}`}
                className="mt-6 inline-flex w-fit items-center gap-2 bg-foreground px-5 py-3 text-xs font-black uppercase text-background transition hover:bg-primary"
              >
                Read story
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">{category.name}</p>
            <h2 className="mt-4 text-4xl font-semibold text-foreground">No stories available yet.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We don’t have any published stories in this category yet, but the page is ready and will update as new content arrives.
            </p>
          </div>
        )}
      </section>

      {shownArticles.length > 1 && (
        <section className="border-y border-border bg-card">
          <div className="jox-container grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
            {shownArticles.slice(1).map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}
    </SiteShell>
  )
}
