import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Clock, Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { ArticleAiTools } from '@/components/article-ai-tools'
import { Comments } from '@/components/comments'
import { SiteShell } from '@/components/site-shell'
import { ArticleViewTracker } from '@/components/tracking/article-view-tracker'
import { JsonLd } from '@/components/seo/json-ld'
import { buildArticleContext } from '@/lib/article-text'
import { getArticleBySlug, getPublishedArticles } from '@/lib/news'
import { breadcrumbJsonLd, buildArticleMetadata, newsArticleJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'

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
  const [article, articles] = await Promise.all([getArticleBySlug(slug), getPublishedArticles()])
  if (!article) notFound()

  const contentBlocks = (() => {
    try {
      const parsed = JSON.parse(article.content ?? '')
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  })()

  const related = articles
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .concat(articles.filter((item) => item.slug !== article.slug && item.category !== article.category))
    .slice(0, 3)

  const articleContext = buildArticleContext(article)

  const renderBlock = (block: any, index: number) => {
    switch (block.type) {
      case 'heading':
        return (
          <h2 key={index} className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {block.text}
          </h2>
        )
      case 'subheading':
        return (
          <h3 key={index} className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {block.text}
          </h3>
        )
      case 'quote':
        return (
          <blockquote key={index} className="rounded-3xl border-l-4 border-primary bg-muted px-6 py-5 text-xl italic leading-8 text-foreground">
            {block.text}
          </blockquote>
        )
      case 'pull_quote':
        return (
          <div key={index} className="rounded-3xl border border-border bg-card p-6 text-lg font-semibold text-foreground">
            {block.text}
          </div>
        )
      case 'image':
        return (
          <figure key={index} className="overflow-hidden rounded-[2rem] bg-muted shadow-sm">
            <img src={block.url || '/placeholder.jpg'} alt={block.alt || article.title} className="w-full object-cover" />
            {block.caption && <figcaption className="border-t border-border bg-background px-4 py-3 text-sm text-muted-foreground">{block.caption}</figcaption>}
          </figure>
        )
      case 'image_gallery':
        return (
          <div key={index} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(block.items ?? []).map((src: string, itemIndex: number) => (
              <div key={itemIndex} className="overflow-hidden rounded-3xl bg-muted">
                <img src={src || '/placeholder.jpg'} alt={`${article.title} image ${itemIndex + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )
      case 'video':
        return block.url ? (
          <div key={index} className="overflow-hidden rounded-[2rem] bg-black">
            <iframe
              src={block.url}
              title={block.caption || 'Embedded video'}
              className="h-80 w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          </div>
        ) : null
      case 'fact_box':
        return (
          <div key={index} className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Fact Box</p>
            <p className="mt-3 text-base text-foreground">{block.text}</p>
          </div>
        )
      case 'timeline':
        return (
          <div key={index} className="space-y-3 rounded-3xl border border-border bg-muted p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Timeline</p>
            {Array.isArray(block.items)
              ? block.items.map((item: string, itemIndex: number) => (
                  <div key={itemIndex} className="rounded-2xl bg-background p-4 text-sm text-foreground">
                    {item}
                  </div>
                ))
              : null}
          </div>
        )
      case 'statistics':
        return (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            {Array.isArray(block.items)
              ? block.items.map((stat: any, statIndex: number) => (
                  <div key={statIndex} className="rounded-3xl border border-border bg-card p-5 text-sm text-foreground">
                    <p className="font-black text-2xl">{stat.value}</p>
                    <p className="mt-2 text-muted-foreground">{stat.label}</p>
                  </div>
                ))
              : null}
          </div>
        )
      case 'ai_summary':
        return (
          <div key={index} className="rounded-3xl border border-primary/40 bg-primary/5 p-6 text-sm leading-7 text-foreground">
            <p className="font-semibold text-foreground">AI Summary</p>
            <p className="mt-3">{block.text}</p>
          </div>
        )
      case 'custom_html':
        return (
          <div key={index} className="prose rounded-3xl border border-border bg-muted p-6 text-foreground">
            <div dangerouslySetInnerHTML={{ __html: block.html ?? '' }} />
          </div>
        )
      default:
        return (
          <p key={index} className="text-lg leading-8 text-foreground">
            {block.text}
          </p>
        )
    }
  }

  const categorySlug = article.category.toLowerCase().replace(/\s+/g, '-')

  return (
    <SiteShell showTicker>
      <JsonLd
        data={[
          newsArticleJsonLd(article),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: article.category, path: `/category/${categorySlug}` },
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
                href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="mb-4 inline-flex border border-border px-3 py-1.5 text-xs font-black uppercase text-primary transition hover:border-primary"
              >
                {article.category}
              </Link>
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
                AI Brief
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                BDL AI tracks this story across live updates, source confidence, and reader
                interest so you can understand the main point without losing the context.
              </p>
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
            </aside>
          </div>
        </header>

        <section className="jox-container pb-10">
          <div id="article-context" data-context={articleContext} className="hidden" />
        </section>

        <section className="jox-container space-y-6 pb-10">
          <div className="overflow-hidden rounded-[2rem] bg-muted shadow-2xl shadow-black/5">
            <div className="relative aspect-square sm:aspect-[4/3]">
              <Image
                src={article.image || '/placeholder.jpg'}
                alt={article.title}
                fill
                priority
                unoptimized={article.image?.startsWith('http')}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover transition duration-700 ease-out hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute left-6 bottom-6 rounded-3xl border border-white/15 bg-black/60 p-4 text-white shadow-xl shadow-black/20">
                <p className="text-xs uppercase tracking-[0.32em] text-white/70">{article.category}</p>
                <p className="mt-2 text-sm text-white/80">{article.region}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {article.imageCredit ? `Image credit: ${article.imageCredit}` : 'Visual dispatch from the BDL newsroom.'}
                </p>
              </div>
            </div>
          </div>

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
            {article.authorId ? (
              <Link href={`/author/${article.authorId}`} className="font-black text-foreground transition hover:text-primary">
                {article.author}
              </Link>
            ) : (
              <p className="font-black text-foreground">{article.author}</p>
            )}
            <p className="text-sm text-foreground">{article.authorRole}</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-foreground">
              <Clock className="size-4 text-primary" />
              {article.readingTime} min read
            </p>
            <p className="text-sm">{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <div className="rounded-3xl border border-border bg-card p-4 text-sm text-foreground">
              <p className="font-black uppercase tracking-[0.32em] text-primary">Impact</p>
              <div className="mt-4 grid gap-3 text-foreground">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span>Signal</span>
                  <span className="font-semibold">{article.engagement}%</span>
                </div>
                <div className="flex items-center justify-between pt-3 text-foreground">
                  <span>Trend</span>
                  <span className="font-semibold">+{article.trendDelta}%</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-8 text-lg leading-8 text-foreground">
            {contentBlocks ? (
              contentBlocks.map((block, index) => renderBlock(block, index))
            ) : (article.content ?? '').trim() ? (
              (article.content ?? '').split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <div className="rounded-3xl border border-border bg-card p-8">
                <p className="text-lg font-semibold text-foreground">This story is curated for you.</p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Sonke can summarize this headline, explain the context, or help you filter the latest news into what matters most. Tap the assistant at the bottom-right to get the quick version.
                </p>
              </div>
            )}
          </div>

        </section>
      </article>

      {article.id && <Comments articleId={article.id} />}

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
          href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-foreground transition hover:text-primary"
        >
          More in {article.category}
          <ArrowUpRight className="size-4 text-primary" />
        </Link>
      </section>
    </SiteShell>
  )
}
