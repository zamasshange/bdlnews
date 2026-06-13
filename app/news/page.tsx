import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Search, Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { SiteShell } from '@/components/site-shell'
import { getPublishedArticles, getTrendingArticles } from '@/lib/news'
import { NAV_LINKS } from '@/lib/data'
import { categoryPathFromName } from '@/lib/category-paths'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata = buildPageMetadata({
  title: 'Latest News & Breaking Headlines',
  description:
    'Browse the latest news, breaking headlines, and live updates from BDL News — covering South Africa, Africa, world affairs, business, technology, sports, and entertainment.',
  path: '/news',
  keywords: ['Latest News', 'Breaking News', 'News Today', 'Headlines Today', 'Live News Updates', 'Trending News'],
})

export default async function NewsPage() {
  const [articles, trending] = await Promise.all([getPublishedArticles(30), getTrendingArticles('trending', 10)])
  const featured = articles[0]

  return (
    <SiteShell showTicker>
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary tracking-[0.32em]">News Hub</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              The central hub for BDL news, filters, and AI context.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Browse the latest stories, filter by category, and discover editors’ picks from across the newsroom.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-primary">
              <Search className="size-5" />
              Live filters
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Filter by category, world region, or editorial theme to see the stories that matter now.
            </p>
            <div className="mt-6 grid gap-3 text-sm uppercase text-foreground">
              {NAV_LINKS.slice(1).map((link) => (
                <Link key={link} href={categoryPathFromName(link)} className="rounded-2xl border border-border px-3 py-2 transition hover:border-primary hover:text-primary">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {featured && (
        <section className="jox-container py-10">
          <div className="grid gap-8 lg:grid-cols-[0.6fr_0.4fr]">
            <div className="rounded-3xl overflow-hidden border border-border bg-white shadow-sm">
              <div className="relative aspect-[1.8] bg-muted">
                <Image src={featured.image} alt={featured.title} fill className="object-cover" />
              </div>
              <div className="p-8">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Lead story</p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight text-foreground">{featured.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{featured.dek}</p>
                <Link href={`/article/${featured.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase text-primary">
                  Read story <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
            <aside className="grid gap-4">
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-xs font-black uppercase text-primary">Trending now</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {trending.map((article) => (
                    <Link key={article.slug} href={`/article/${article.slug}`} className="block transition hover:text-primary">
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-xs font-black uppercase text-primary">News coverage</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Stories are updated with live editorial context, AI summaries, and related topic signals as they develop.
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}

      <section className="jox-container py-10">
        <div className="grid gap-6 xl:grid-cols-3">
          {articles.slice(0, 12).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
