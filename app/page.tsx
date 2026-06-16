import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { LiveUpdatesPanel } from '@/components/live-updates-panel'
import { NewsletterForm } from '@/components/newsletter-form'
import { SiteShell } from '@/components/site-shell'
import { ArticleCard } from '@/components/article-card'
import { type Article, type Category } from '@/lib/data'
import { StoryHeadline } from '@/components/story-headline'
import { buildExternalOnlyFeed, buildHomeFeed } from '@/lib/home-feed'
import { categoryPathFromName } from '@/lib/category-paths'
import { getLatestWireArticles, getLiveUpdates, getPublishedArticles, getTrendingArticles } from '@/lib/news'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata, homepageItemListJsonLd } from '@/lib/seo'
import { coreSearchKeywords } from '@/lib/seo-keywords'
import { siteConfig } from '@/lib/site'
import {
  formatPresspointDate,
  PresspointMetaLine,
  PresspointSectionHeading,
} from '@/components/presspoint/section-heading'

export const metadata = {
  ...buildPageMetadata({
    title: 'Breaking News, Latest Headlines & Live Updates',
    description:
      'BDL News delivers breaking news, latest headlines, South African news, African news, world news, business, technology, sports, entertainment, and current affairs — founded by Zama Shange.',
    path: '/',
    keywords: [
      ...coreSearchKeywords,
      'Breaking News',
      'Latest News',
      'South African News',
      'African News',
      'World News',
    ],
  }),
  title: {
    absolute: `${siteConfig.name} — Breaking News, Latest Headlines & Live Updates`,
  },
}

export const revalidate = 60

function pickByCategory(articles: Article[], category: Category, count: number) {
  return articles.filter((article) => article.category === category).slice(0, count)
}

export default async function HomePage() {
  const [articles, liveFeed, trendingArticles, externalArticles] = await Promise.all([
    getPublishedArticles(40),
    getLiveUpdates(),
    getTrendingArticles(),
    getLatestWireArticles(160),
  ])

  const feed = articles.length
    ? await buildHomeFeed(articles, externalArticles, trendingArticles)
    : await buildExternalOnlyFeed(externalArticles, trendingArticles)

  const hasStories = feed.stats.ownCount + feed.stats.wireCount > 0

  if (!hasStories) {
    return (
      <SiteShell showTicker>
        <JsonLd data={homepageItemListJsonLd([])} />
        <section className="jox-container py-16">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">BDL News</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">No stories yet</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The homepage feed is empty right now. Publish your first article from the admin desk, or connect your wire sources.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Open Admin Desk
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/about-us"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                About BDL News
              </Link>
            </div>
          </div>
        </section>
      </SiteShell>
    )
  }

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
  } = feed

  const pool = [
    featured,
    secondFeature,
    featureTwo,
    ...sideStories,
    ...gridStories,
    ...keepReadingStories,
    ...resources,
    ...wireHighlights,
    ...spotlightStories,
  ].filter(Boolean) as Article[]

  const economyStories = pickByCategory(pool, 'Business', 2).length
    ? pickByCategory(pool, 'Business', 2)
    : gridStories.slice(0, 2)
  const techStories = pickByCategory(pool, 'Technology', 3)
  const sportsStories = pickByCategory(pool, 'Sports', 2)
  const lifestyleStories = pickByCategory(pool, 'Entertainment', 4)
  const scienceStories = pickByCategory(pool, 'Science', 2).concat(pickByCategory(pool, 'Health', 2))

  const headlineArticles = pool.slice(0, 12)

  return (
    <SiteShell showTicker>
      <JsonLd data={homepageItemListJsonLd(headlineArticles)} />

      <section className="jox-container py-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.42fr)] lg:gap-10">
          <article className="story-link group space-y-8">
            <Link href={`/article/${featured.slug}`} className="block">
              <div className="relative aspect-[1.6] overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[16/10]">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  className="story-image object-cover object-center"
                  unoptimized={featured.image?.startsWith('http')}
                />
                <div className="presspoint-hero-gradient absolute inset-0 hidden sm:block" />
                <div className="absolute inset-x-0 bottom-0 hidden p-6 sm:block md:p-8">
                  <span className="inline-flex rounded bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                    {featured.category}
                  </span>
                  <StoryHeadline
                    as="h1"
                    title={featured.title}
                    limit="hero"
                    lines={3}
                    className="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-white transition group-hover:text-white/90 md:text-5xl"
                  />
                  <PresspointMetaLine
                    category={featured.category}
                    date={formatPresspointDate(featured.publishedAt)}
                    className="mt-4 text-white/75 [&_a]:text-white/85 [&_span:last-child]:text-white/75"
                  />
                </div>
              </div>
              <div className="mt-5 sm:hidden">
                <span className="inline-flex rounded bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                  {featured.category}
                </span>
                <StoryHeadline
                  as="h1"
                  title={featured.title}
                  limit="hero"
                  lines={3}
                  className="mt-4 text-3xl font-semibold leading-tight text-foreground transition group-hover:text-primary"
                />
                <PresspointMetaLine
                  category={featured.category}
                  date={formatPresspointDate(featured.publishedAt)}
                  className="mt-3"
                />
              </div>
            </Link>

            <div className="border-t border-border pt-6">
              <Link href={`/article/${secondFeature.slug}`} className="group block">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <PresspointMetaLine
                    category={secondFeature.author}
                    date={new Date(secondFeature.publishedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Read full story
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
                <StoryHeadline
                  as="h2"
                  title={secondFeature.title}
                  limit="feature"
                  lines={2}
                  className="mt-4 text-2xl font-semibold leading-tight text-foreground transition group-hover:text-primary sm:text-3xl md:text-4xl"
                />
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  {secondFeature.dek}
                </p>
              </Link>
            </div>

            <div className="mt-8">
              <PresspointSectionHeading title="World News" href={categoryPathFromName('World')} />
              <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-0 sm:grid sm:gap-6 md:grid-cols-2">
                {[featureTwo, ...sideStories.slice(0, 1)].map((article) => (
                  <Link
                    key={article.slug}
                    href={`/article/${article.slug}`}
                    className="story-link group grid grid-cols-[minmax(112px,34%)_1fr] gap-4 sm:grid-cols-[140px_1fr]"
                  >
                    <div className="relative aspect-[1.22] overflow-hidden rounded-xl border border-border bg-muted">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 34vw, 140px"
                        className="story-image object-cover object-center"
                        unoptimized={article.image?.startsWith('http')}
                      />
                    </div>
                    <div className="min-w-0 self-center">
                      <PresspointMetaLine
                        category={article.author}
                        date={new Date(article.publishedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                      <StoryHeadline
                        title={article.title}
                        limit="card"
                        lines={3}
                        className="mt-2 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary sm:mt-3 sm:text-lg"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </article>

          <aside className="border-t border-border pt-8 lg:border-t-0 lg:pt-0">
            <PresspointSectionHeading title="Top Global Stories" href="/news" />
            <div className="mt-4">
              {sideStories.map((article) => (
                <ArticleCard key={article.slug} article={article} layout="horizontal" />
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="jox-container pb-10 md:pb-14">
        <PresspointSectionHeading title="Economy" href={categoryPathFromName('Business')} />
        <div className="mt-4 grid gap-5 sm:mt-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {economyStories.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
          {gridStories[0] ? <ArticleCard article={gridStories[0]} size="lg" /> : null}
        </div>
      </section>

      {techStories.length > 0 && (
        <section className="jox-container pb-14">
          <PresspointSectionHeading title="Technology" href={categoryPathFromName('Technology')} />
          <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Link href={`/article/${techStories[0].slug}`} className="story-link group block">
              <div className="relative aspect-[1.45] overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[16/11]">
                <Image
                  src={techStories[0].image}
                  alt={techStories[0].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="story-image object-cover"
                  unoptimized={techStories[0].image?.startsWith('http')}
                />
                <div className="presspoint-hero-gradient absolute inset-0 hidden sm:block" />
                <div className="absolute inset-x-0 bottom-0 hidden p-6 sm:block">
                  <span className="inline-flex rounded bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                    {techStories[0].category}
                  </span>
                  <StoryHeadline
                    title={techStories[0].title}
                    limit="feature"
                    lines={2}
                    className="mt-4 text-2xl font-semibold leading-tight text-white md:text-3xl"
                  />
                </div>
              </div>
              <div className="mt-4 sm:hidden">
                <PresspointMetaLine
                  category={techStories[0].category}
                  date={formatPresspointDate(techStories[0].publishedAt)}
                />
                <StoryHeadline
                  title={techStories[0].title}
                  limit="feature"
                  lines={2}
                  className="mt-3 text-xl font-semibold leading-snug text-foreground"
                />
              </div>
            </Link>
            <div className="grid content-start gap-4">
              {techStories.slice(1, 3).map((article) => (
                <Link
                  key={article.slug}
                  href={`/article/${article.slug}`}
                  className="rounded-2xl border border-border p-5 transition hover:border-primary/30"
                >
                  <PresspointMetaLine
                    category={article.author}
                    date={formatPresspointDate(article.publishedAt)}
                  />
                  <StoryHeadline
                    title={article.title}
                    limit="card"
                    lines={2}
                    className="mt-3 text-xl font-semibold leading-snug text-foreground"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {scienceStories.length > 0 && (
        <section className="jox-container pb-14">
          <PresspointSectionHeading title="Science & Health" href={categoryPathFromName('Science')} />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {scienceStories.slice(0, 4).map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {sportsStories.length > 0 && (
        <section className="bg-brand-navy py-14 text-white">
          <div className="jox-container">
            <PresspointSectionHeading
              title="Sports and Entertainment"
              href={categoryPathFromName('Sports')}
              dark
            />
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {sportsStories.map((article) => (
                <Link key={article.slug} href={`/article/${article.slug}`} className="story-link group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="story-image object-cover"
                      unoptimized={article.image?.startsWith('http')}
                    />
                    <div className="presspoint-hero-gradient absolute inset-0" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <span className="inline-flex rounded bg-primary px-3 py-1 text-xs font-semibold uppercase">
                        {article.category}
                      </span>
                      <StoryHeadline
                        title={article.title}
                        limit="card"
                        lines={2}
                        className="mt-4 text-2xl font-semibold leading-snug text-white"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {lifestyleStories.length > 0 && (
        <section className="jox-container py-14">
          <PresspointSectionHeading title="Lifestyle & Culture" href={categoryPathFromName('Entertainment')} />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {lifestyleStories.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {keepReadingStories.length > 0 && (
        <section className="jox-container pb-14">
          <PresspointSectionHeading title="Other news" href="/news" />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {keepReadingStories.slice(0, 3).map((article) => (
              <Link key={article.slug} href={`/article/${article.slug}`} className="story-link group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="33vw"
                    className="story-image object-cover"
                    unoptimized={article.image?.startsWith('http')}
                  />
                </div>
                <div className="pt-4">
                  <PresspointMetaLine
                    category={article.author}
                    date={new Date(article.publishedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                  <StoryHeadline
                    title={article.title}
                    limit="card"
                    lines={2}
                    className="mt-3 text-xl font-semibold leading-snug text-foreground transition group-hover:text-primary"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-border bg-muted/40">
        <div className="jox-container grid gap-8 py-12 lg:grid-cols-[0.35fr_1fr]">
          <PresspointSectionHeading title="Live Wire" />
          <LiveUpdatesPanel initialItems={liveFeed} />
        </div>
      </section>

      <section id="subscribe" className="presspoint-cta-bg py-16 text-white">
        <div className="jox-container text-center">
          <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
            Join readers who never miss a headline.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
            Stay informed wherever you are — get breaking news and daily headlines from BDL News.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <NewsletterForm variant="cta" />
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
