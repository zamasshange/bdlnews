import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Clock, Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { ArticleAiTools } from '@/components/article-ai-tools'
import { ArticleBodyContent } from '@/components/article/article-body-content'
import { ArticleHeroFigure } from '@/components/article-hero-figure'
import { ArticleSourceCredit } from '@/components/article-source-credit'
import { Comments } from '@/components/comments'
import { SiteShell } from '@/components/site-shell'
import { ArticleViewTracker } from '@/components/tracking/article-view-tracker'
import { JsonLd } from '@/components/seo/json-ld'
import { categoryPath, categoryPathFromName } from '@/lib/category-paths'
import { buildArticleContext } from '@/lib/article-text'
import { getArticleBySlug, getRelatedArticles } from '@/lib/news'
import { breadcrumbJsonLd, buildArticleMetadata, newsArticleJsonLd } from '@/lib/seo'

export const revalidate = 180
export const maxDuration = 30
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}

  return buildArticleMetadata(article)
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const related = await getRelatedArticles(article.slug, article.category, 3)

  const contentBlocks = (() => {
    try {
      const parsed = JSON.parse(article.content ?? '')
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  })()
  const isWireStory = Boolean(article.externalUrl)
  const articleContext = buildArticleContext(article)

  const categorySlug = article.category.toLowerCase().replace(/\s+/g, '-')
  const categoryHref = categoryPath(categorySlug)

  return (
    <SiteShell showTicker>
      <JsonLd
        data={[
          newsArticleJsonLd(article),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: article.category, path: categoryHref },
            { name: article.title, path: `/article/${article.slug}` },
          ]),
        ]}
      />
      <ArticleViewTracker
        articleId={article.id ?? article.slug}
        slug={article.slug}
        title={article.title}
        category={article.category}
        author={article.author}
      />
      <article>
        <header className="jox-container py-8 md:py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
            <div>
              <Link
                href={categoryPathFromName(article.category)}
                className="mb-4 inline-flex border border-border px-3 py-1.5 text-xs font-black uppercase text-primary transition hover:border-primary"
              >
                {article.category}
              </Link>
              {isWireStory ? (
                <span className="mb-4 ml-2 inline-flex border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-black uppercase text-primary">
                  Wire Story
                </span>
              ) : null}
              <h1 className="max-w-5xl text-5xl font-semibold leading-tight text-foreground md:text-6xl">
                {article.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {article.dek}
              </p>
            </div>

            <aside className="border border-border bg-card p-5">
              <p className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-primary">
                <Sparkles className="size-4" />
                {isWireStory ? 'Wire Brief' : 'AI Brief'}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isWireStory
                  ? `This story is syndicated from ${article.author}. BDL presents the reporting with source credit and a direct link to the original publisher.`
                  : 'BDL AI tracks this story across live updates, source confidence, and reader interest so you can understand the main point without losing the context.'}
              </p>
              {!isWireStory ? (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs uppercase text-muted-foreground">
                  <div>
                    <p className="font-black text-foreground">{article.engagement}%</p>
                    <p>Signal</p>
                  </div>
                  <div>
                    <p className="font-black text-foreground">+{article.trendDelta}%</p>
                    <p>Trend</p>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </header>

        <section className="jox-container pb-10">
          <div id="article-context" data-context={articleContext} className="hidden" />
        </section>

        <section className="jox-container space-y-6 pb-10">
          <ArticleHeroFigure article={article} />

          {article.gallery?.length ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {article.gallery.slice(0, 3).map((src, index) => (
                <div key={`${src}-${index}`} className="overflow-hidden rounded-3xl bg-muted shadow-sm shadow-black/5">
                  <Image
                    src={src || '/placeholder.jpg'}
                    alt={`${article.title} image ${index + 1}`}
                    width={640}
                    height={480}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    unoptimized={src?.startsWith('http')}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="jox-container grid gap-10 py-10 lg:grid-cols-[0.22fr_0.78fr]">
          <aside className="space-y-6 text-xs uppercase text-muted-foreground lg:sticky lg:top-[5.75rem]">
            {article.externalUrl ? (
              <p className="font-black text-foreground">{article.author}</p>
            ) : article.authorId ? (
              <Link href={`/author/${article.authorId}`} className="font-black text-foreground transition hover:text-primary">
                {article.author}
              </Link>
            ) : (
              <p className="font-black text-foreground">{article.author}</p>
            )}
            <p className="text-sm text-foreground">
              {article.externalUrl ? `Syndicated from ${article.author}` : article.authorRole}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-foreground">
              <Clock className="size-4 text-primary" />
              {article.readingTime} min read
            </p>
            <p className="text-sm">{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <div className="rounded-3xl border border-border bg-card p-4 text-sm text-foreground">
              <p className="font-black uppercase tracking-[0.32em] text-primary">{isWireStory ? 'Source' : 'Impact'}</p>
              <div className="mt-4 grid gap-3 text-foreground">
                {isWireStory ? (
                  <>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span>Publisher</span>
                      <span className="font-semibold">{article.author}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span>Region</span>
                      <span className="font-semibold">{article.region}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span>Signal</span>
                      <span className="font-semibold">{article.engagement}%</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 text-foreground">
                      <span>Trend</span>
                      <span className="font-semibold">+{article.trendDelta}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>

          <div className="space-y-8 text-lg leading-8 text-foreground">
            <ArticleBodyContent
              article={article}
              contentBlocks={contentBlocks}
              isWireStory={isWireStory}
              slug={article.slug}
            />
          </div>

        </section>
      </article>

      <ArticleSourceCredit article={article} />

      {article.id && !article.externalUrl && <Comments articleId={article.id} />}

      <section className="border-t border-border bg-muted/30">
        <div className="jox-container py-10">
          <ArticleAiTools article={article} />
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="jox-container grid gap-6 py-12 lg:grid-cols-[0.3fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase text-primary">Keep Reading</p>
            <h2 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Related Stories
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="jox-container py-10">
        <Link
          href={categoryPathFromName(article.category)}
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-foreground transition hover:text-primary"
        >
          More in {article.category}
          <ArrowUpRight className="size-4 text-primary" />
        </Link>
      </section>
    </SiteShell>
  )
}
