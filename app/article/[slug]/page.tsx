import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Bot, Clock, Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { Comments } from '@/components/comments'
import { SiteShell } from '@/components/site-shell'
import { ArticleViewTracker } from '@/components/tracking/article-view-tracker'
import { getArticleBySlug, getPublishedArticles } from '@/lib/news'

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

  return {
    title: `${article.title} | BDL News`,
    description: article.dek,
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [article, articles] = await Promise.all([getArticleBySlug(slug), getPublishedArticles()])
  if (!article) notFound()

  const related = articles
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .concat(articles.filter((item) => item.slug !== article.slug && item.category !== article.category))
    .slice(0, 3)

  return (
    <SiteShell showTicker>
      <ArticleViewTracker articleId={article.id ?? article.slug} />
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

        <section className="jox-container">
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            <Image
              src={article.image}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>
        </section>

        <section className="jox-container grid gap-10 py-10 lg:grid-cols-[0.22fr_0.56fr_0.22fr]">
          <aside className="text-xs uppercase text-muted-foreground">
            {article.authorId ? (
              <Link href={`/author/${article.authorId}`} className="font-black text-foreground transition hover:text-primary">{article.author}</Link>
            ) : (
              <p className="font-black text-foreground">{article.author}</p>
            )}
            <p>{article.authorRole}</p>
            <p className="mt-4 flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {article.readingTime} min read
            </p>
            <p className="mt-2">{article.region}</p>
          </aside>

          <div className="space-y-6 text-lg leading-8 text-foreground">
            {(article.content ?? '').split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <aside className="h-fit border border-border bg-background p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-primary">
              <Bot className="size-4" />
              Ask BDL
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Need the timeline, impact, or simpler explanation? Open the assistant and ask
              about this story.
            </p>
          </aside>
        </section>
      </article>

      {article.id && <Comments articleId={article.id} />}

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
