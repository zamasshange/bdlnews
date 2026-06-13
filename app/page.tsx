import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock, Play } from 'lucide-react'
import { LiveUpdatesPanel } from '@/components/live-updates-panel'
import { NewsletterForm } from '@/components/newsletter-form'
import { SiteShell } from '@/components/site-shell'
import { ArticleCard } from '@/components/article-card'
import {
  type Article,
  type Category,
} from '@/lib/data'
import { LivePulseBar, StoryBadge } from '@/components/home/live-pulse-bar'
import { StoryHeadline } from '@/components/story-headline'
import { AskSonkeCard } from '@/components/home/ask-sonke-card'
import { CategoryQuickJump } from '@/components/home/category-quick-jump'
import { buildExternalOnlyFeed, buildHomeFeed } from '@/lib/home-feed'
import { fetchAllExternalArticles, getLiveUpdates, getPublishedArticles, getTrendingArticles } from '@/lib/news'
import { headlineLimits, shortHeadline } from '@/lib/headlines'
import { buildPageMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site'

export const metadata = {
  ...buildPageMetadata({
  title: 'Breaking News, Latest Headlines & Live Updates',
  description:
    'BDL News delivers breaking news, latest headlines, South African news, African news, world news, business, technology, sports, entertainment, and current affairs — founded by Zama Shange.',
  path: '/',
  keywords: [
    'Breaking News',
    'Latest News',
    'News Today',
    'Headlines Today',
    'Live News Updates',
    'Trending News',
    'South African News',
    'African News',
    'World News',
  ],
  }),
  title: {
    absolute: `${siteConfig.name} — Breaking News, Latest Headlines & Live Updates`,
  },
}

function NewsLink({
  article,
  className,
  children,
}: {
  article: Article
  className: string
  children: React.ReactNode
}) {
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
    fetchAllExternalArticles(500),
  ])

  const feed = articles.length
    ? await buildHomeFeed(articles, externalArticles, trendingArticles)
    : await buildExternalOnlyFeed(externalArticles, trendingArticles)

  const {
    featured,
    secondFeature,
    featureTwo,
    sideStories,
    gridStories,
    resources,
    keepReadingStories,
    wireHighlights,
    spotlightStories,
    trendingTopics,
    mode,
    stats,
  } = feed

  const latestSectionTitle =
    mode === 'wire'
      ? 'Fresh headlines from the wire'
      : mode === 'mixed'
        ? 'More stories across BDL and the wire'
        : 'Latest from the BDL newsroom'

  return (
    <SiteShell showTicker>
      <LivePulseBar
        mode={mode}
        ownCount={stats.ownCount}
        wireCount={stats.wireCount}
        recentOwnCount={stats.recentOwnCount}
      />
      <CategoryQuickJump />
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.48fr)]">
          <div className="grid gap-9">
            <article className="story-link group">
              <NewsLink article={featured} className="block">
                <div className="relative aspect-[1.6] overflow-hidden border border-border bg-muted">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="story-image object-cover object-center"
                    unoptimized={featured.image?.startsWith('http')}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" />
                </div>
                <div className="mt-6">
                  <StoryBadge article={featured} />
                </div>
                <StoryHeadline
                  as="h1"
                  title={featured.title}
                  limit="hero"
                  lines={2}
                  className="mt-5 max-w-5xl text-4xl font-medium leading-[1.08] text-foreground transition group-hover:text-primary md:text-5xl"
                />
              </NewsLink>
              <StoryMeta
                category={featured.category}
                readingTime={featured.readingTime}
                className="mt-5"
              />
            </article>

            <article className="story-link group">
              <NewsLink article={secondFeature} className="block">
                <div className="relative aspect-[1.6] overflow-hidden border border-border bg-muted">
                  <Image
                    src={secondFeature.image}
                    alt={secondFeature.title}
                    fill
                    className="story-image object-cover object-center"
                    unoptimized={secondFeature.image?.startsWith('http')}
                  />
                </div>
                <div className="mt-6">
                  <StoryBadge article={secondFeature} />
                </div>
                <StoryHeadline
                  as="h2"
                  title={secondFeature.title}
                  limit="hero"
                  lines={2}
                  className="mt-5 max-w-5xl text-4xl font-medium leading-[1.08] text-foreground transition group-hover:text-primary md:text-5xl"
                />
              </NewsLink>
              <StoryMeta
                category={secondFeature.category}
                readingTime={secondFeature.readingTime}
                className="mt-5"
              />
            </article>
          </div>

          <aside className="grid content-start gap-6">
            {sideStories.map((article) => (
              <SideRailStory key={article.slug} article={article} />
            ))}
            <AskSonkeCard />
          </aside>
        </div>
      </section>

      <section className="jox-container grid gap-10 pb-14 lg:grid-cols-[0.95fr_1fr]">
        <article className="story-link group">
          <NewsLink article={featureTwo} className="block">
            <div className="relative aspect-[1.18] overflow-hidden border border-border bg-muted">
              <Image
                src={featureTwo.image}
                alt={featureTwo.title}
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="story-image object-cover object-center"
                unoptimized={featureTwo.image?.startsWith('http')}
              />
            </div>
            <div className="mt-7">
              <StoryBadge article={featureTwo} />
            </div>
            <StoryMeta
              category={featureTwo.category}
              readingTime={featureTwo.readingTime}
              className="mt-5"
              linked={false}
            />
            <StoryHeadline
              as="h2"
              title={featureTwo.title}
              limit="feature"
              lines={2}
              className="mt-5 max-w-4xl text-3xl font-medium leading-tight text-foreground transition group-hover:text-primary md:text-4xl"
            />
          </NewsLink>
        </article>

        <div className="grid gap-x-8 gap-y-9 md:grid-cols-2">
          {gridStories.map((article) => (
            <GridStory key={article.slug} article={article} />
          ))}
        </div>
      </section>

      {keepReadingStories.length > 0 && (
        <section className="jox-container py-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Keep Reading</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">{latestSectionTitle}</h2>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {keepReadingStories.map((article) => (
              <ArticleCard key={article.slug} article={article} size="md" />
            ))}
          </div>
        </section>
      )}

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
              {shortHeadline(topic, headlineLimits.ticker)}
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
              key={article.slug}
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
              <StoryHeadline
                title={article.title}
                limit="card"
                lines={2}
                className="text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary"
              />
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black uppercase text-foreground">
                Read More <ArrowUpRight className="size-3.5 text-primary" />
              </span>
            </NewsLink>
          ))}
        </div>
      </section>

      <section className="jox-container grid gap-8 pb-14 lg:grid-cols-[0.38fr_1fr]">
        <SectionTitle kicker="Live Wire" title="Fresh From The Feed" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {wireHighlights.map((article) => (
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              className="story-link group overflow-hidden border border-border bg-white transition hover:border-primary"
            >
              <div className="relative h-52 overflow-hidden bg-muted">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="story-image object-cover"
                  unoptimized={article.image?.startsWith('http')}
                />
              </div>
              <div className="p-5">
                <StoryBadge article={article} />
                <StoryHeadline
                  as="h2"
                  title={article.title}
                  limit="card"
                  lines={2}
                  className="mt-4 text-xl font-semibold leading-tight text-foreground transition group-hover:text-primary"
                />
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {article.author} • {new Date(article.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
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
        {spotlightStories.map((article) => (
          <Link
            key={article.slug}
            href={`/article/${article.slug}`}
            className="group flex items-center gap-4 border border-border p-4 transition hover:border-primary hover:bg-card"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition group-hover:bg-primary">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-primary">{article.category}</p>
              <StoryHeadline
                title={article.title}
                limit="compact"
                lines={2}
                className="text-xl font-medium leading-tight text-foreground"
              />
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
      <div className="relative aspect-[1.22] overflow-hidden border border-border bg-muted">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 42vw, 16vw"
          className="story-image object-cover"
          unoptimized={article.image?.startsWith('http')}
        />
      </div>
      <div>
        <StoryBadge article={article} />
        <StoryHeadline
          as="h2"
          title={article.title}
          limit="rail"
          lines={3}
          className="mt-4 text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary"
        />
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
      <div className="relative aspect-[1.55] overflow-hidden border border-border bg-muted">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 24vw"
          className="story-image object-cover"
          unoptimized={article.image?.startsWith('http')}
        />
      </div>
      <div className="mt-5">
        <StoryBadge article={article} />
      </div>
      <StoryMeta
        category={article.category}
        readingTime={article.readingTime}
        className="mt-6"
        linked={false}
      />
      <StoryHeadline
        title={article.title}
        limit="card"
        lines={2}
        className="mt-5 text-2xl font-medium leading-tight text-foreground transition group-hover:text-primary"
      />
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

