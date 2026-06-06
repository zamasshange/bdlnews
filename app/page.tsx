import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock, Play } from 'lucide-react'
import { LiveUpdatesPanel } from '@/components/live-updates-panel'
import { NewsletterForm } from '@/components/newsletter-form'
import { SiteShell } from '@/components/site-shell'
import {
  type Article,
  type Category,
} from '@/lib/data'
import { getExternalNewsItems, getLiveUpdates, getPublishedArticles, getTrendingArticles } from '@/lib/news'

function NewsLink({
  article,
  className,
  children,
}: {
  article: Article
  className: string
  children: React.ReactNode
}) {
  if (article.externalUrl) {
    return (
      <a
        href={article.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={`/article/${article.slug}`} className={className}>
      {children}
    </Link>
  )
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [articles, liveFeed, trendingArticles, externalArticles] = await Promise.all([
    getPublishedArticles(),
    getLiveUpdates(),
    getTrendingArticles(),
    getExternalNewsItems(),
  ])

  if (!articles.length) {
    return (
      <SiteShell showTicker>
        <section className="jox-container py-10 md:py-14">
          <div className="grid gap-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">External News Feed</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                Fresh stories from NewsData, GNews, and Mediastack
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                The newsroom is empty for now, so we’re surfacing live external headlines with images and source links.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {externalArticles.map((article) => (
                <a
                  key={article.externalUrl ?? article.slug}
                  href={article.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition hover:border-primary"
                >
                  <div className="relative h-52 overflow-hidden bg-muted">
                    <Image src={article.image} alt={article.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized={article.image?.startsWith('http')} />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{article.category}</p>
                    <h2 className="mt-3 text-xl font-semibold leading-tight text-foreground transition group-hover:text-primary">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{article.dek}</p>
                    <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">{article.author} • {new Date(article.publishedAt).toLocaleDateString()}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </SiteShell>
    )
  }
  const featured = articles[0]
  const externalPool = [...externalArticles]
  let externalIndex = 0

  const featureTwo = articles[5] ?? externalPool[externalIndex++] ?? articles[0]
  const sideStories = [...articles.slice(1, 5)]
  while (sideStories.length < 4 && externalIndex < externalPool.length) {
    sideStories.push(externalPool[externalIndex++])
  }

  const gridStories = [articles[1], articles[4], articles[6], articles[7]].filter(Boolean)
  while (gridStories.length < 4 && externalIndex < externalPool.length) {
    gridStories.push(externalPool[externalIndex++])
  }

  const resources = [...articles.slice(5, 8)]
  while (resources.length < 3 && externalIndex < externalPool.length) {
    resources.push(externalPool[externalIndex++])
  }

  const trendingTopics = trendingArticles.length ? trendingArticles.map((article) => article.title) : articles.map((article) => article.title)

  return (
    <SiteShell showTicker>
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.48fr)]">
          <article className="story-link group">
            <Link href={`/article/${featured.slug}`} className="block">
              <div className="relative aspect-[1.6] overflow-hidden bg-muted">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="story-image object-cover object-center"
                />
              </div>
              <h1 className="mt-8 max-w-5xl text-4xl font-medium leading-[1.08] text-foreground transition group-hover:text-primary md:text-5xl">
                {featured.title}
              </h1>
            </Link>
            <StoryMeta
              category={featured.category}
              readingTime={featured.readingTime}
              className="mt-5"
            />
          </article>

          <aside className="grid content-start">
            {sideStories.map((article) => (
              <SideRailStory key={article.externalUrl ?? article.slug} article={article} />
            ))}
          </aside>
        </div>
      </section>

      <section className="jox-container grid gap-10 pb-14 lg:grid-cols-[0.95fr_1fr]">
        <article className="story-link group">
          <NewsLink article={featureTwo} className="block">
            <div className="relative aspect-[1.18] overflow-hidden bg-muted">
              <Image
                src={featureTwo.image}
                alt={featureTwo.title}
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="story-image object-cover object-center"
              />
            </div>
            <StoryMeta
              category={featureTwo.category}
              readingTime={featureTwo.readingTime}
              className="mt-7"
              linked={false}
            />
            <h2 className="mt-5 max-w-4xl text-3xl font-medium leading-tight text-foreground transition group-hover:text-primary md:text-5xl">
              {featureTwo.title}
            </h2>
          </NewsLink>
        </article>

        <div className="grid gap-x-8 gap-y-9 md:grid-cols-2">
          {gridStories.map((article) => (
            <GridStory key={article.externalUrl ?? article.slug} article={article} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="jox-container grid gap-8 py-12 lg:grid-cols-[0.45fr_1fr]">
          <SectionTitle kicker="Live Wire" title="Happening Now" />
          <LiveUpdatesPanel initialItems={liveFeed} />
        </div>
      </section>

      <section className="overflow-hidden py-10">
        <div className="ticker-track flex w-max gap-8 whitespace-nowrap text-3xl font-semibold leading-none text-foreground/10 md:text-5xl">
          {[...trendingTopics, ...trendingTopics, ...trendingTopics].map((topic, index) => (
            <span key={`${topic}-${index}`} className="flex items-center gap-8">
              {topic}
              <span className="text-primary">*</span>
            </span>
          ))}
        </div>
      </section>

      <section className="jox-container grid gap-8 pb-14 lg:grid-cols-[0.38fr_1fr]">
        <SectionTitle kicker="Articles & Resources" title="More To Read" />
        <div className="grid gap-5 md:grid-cols-3">
          {resources.map((article) => (
            <NewsLink
              key={article.externalUrl ?? article.slug}
              article={article}
              className="group border-t border-border pt-4"
            >
              <p className="mb-3 text-xs font-black uppercase text-primary">
                {article.category} / {new Date(article.publishedAt).toLocaleDateString('en', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <h3 className="text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary">
                {article.title}
              </h3>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black uppercase text-foreground">
                Read More <ArrowUpRight className="size-3.5 text-primary" />
              </span>
            </NewsLink>
          ))}
        </div>
      </section>

      <section className="jox-container grid gap-8 pb-14 lg:grid-cols-[0.38fr_1fr]">
        <SectionTitle kicker="External Wire" title="Live News from the Feed" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {externalArticles.map((article) => (
            <a
              key={article.externalUrl ?? article.slug}
              href={article.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition hover:border-primary"
            >
              <div className="relative h-52 overflow-hidden bg-muted">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized={article.image?.startsWith('http')}
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{article.category}</p>
                <h2 className="mt-3 text-xl font-semibold leading-tight text-foreground transition group-hover:text-primary">
                  {article.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{article.dek}</p>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {article.author} • {new Date(article.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="subscribe" className="border-y border-border bg-primary text-primary-foreground">
        <div className="jox-container grid gap-8 py-12 lg:grid-cols-[1fr_0.86fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase">Newsletter</p>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              Stay informed with our latest news and updates.
            </h2>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <section className="jox-container grid gap-5 py-12 md:grid-cols-3">
        {articles.slice(2, 5).map((article) => (
          <Link
            key={article.slug}
            href={`/article/${article.slug}`}
            className="group flex items-center gap-4 border border-border p-4 transition hover:border-primary"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition group-hover:bg-primary">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-primary">{article.category}</p>
              <h3 className="line-clamp-2 text-xl font-medium leading-tight text-foreground">
                {article.title}
              </h3>
            </div>
          </Link>
        ))}
      </section>
    </SiteShell>
  )
}

function StoryMeta({
  category,
  readingTime,
  className,
  linked = true,
}: {
  category: Category
  readingTime: number
  className?: string
  linked?: boolean
}) {
  const categoryLabel = linked ? (
    <Link
      href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
      className="transition hover:text-primary"
    >
      {category}
    </Link>
  ) : (
    <span>{category}</span>
  )

  return (
    <p className={['flex items-center gap-3 text-base font-medium text-muted-foreground', className].filter(Boolean).join(' ')}>
      {categoryLabel}
      <span className="h-4 w-px bg-border" />
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-4" />
        {readingTime} Min
      </span>
    </p>
  )
}

function SideRailStory({ article }: { article: Article }) {
  return (
    <NewsLink
      article={article}
      className="story-link group grid grid-cols-[minmax(120px,0.86fr)_1fr] gap-6 border-b border-border py-6 first:pt-0"
    >
      <div className="relative aspect-[1.22] overflow-hidden bg-muted">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 42vw, 16vw"
          className="story-image object-cover"
        />
      </div>
      <div>
        <h2 className="text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary">
          {article.title}
        </h2>
        <StoryMeta
          category={article.category}
          readingTime={article.readingTime}
          className="mt-5 text-base"
          linked={false}
        />
      </div>
    </NewsLink>
  )
}

function GridStory({ article }: { article: Article }) {
  return (
    <NewsLink article={article} className="story-link group border-b border-border pb-8">
      <div className="relative aspect-[1.55] overflow-hidden bg-muted">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 24vw"
          className="story-image object-cover"
        />
      </div>
      <StoryMeta
        category={article.category}
        readingTime={article.readingTime}
        className="mt-6"
        linked={false}
      />
      <h3 className="mt-5 text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary">
        {article.title}
      </h3>
    </NewsLink>
  )
}

function SectionTitle({
  kicker,
  title,
  dark = false,
}: {
  kicker: string
  title: string
  dark?: boolean
}) {
  return (
    <div>
      <p className={dark ? 'mb-3 text-xs font-black uppercase text-black/50' : 'mb-3 text-xs font-black uppercase text-primary'}>
        {kicker}
      </p>
      <h2 className={dark ? 'text-4xl font-semibold leading-tight text-black md:text-5xl' : 'text-4xl font-semibold leading-tight text-foreground md:text-5xl'}>
        {title}
      </h2>
    </div>
  )
}

