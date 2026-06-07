import Link from 'next/link'
import Image from 'next/image'
import { Play, Share2, Search } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { getPodcastEpisodes } from '@/lib/news'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'BDL News Podcast — Audio Briefings & Headlines',
  description:
    'Listen to BDL News podcast episodes — audio briefings, headline explainers, and conversations on breaking news, politics, business, technology, and African current affairs.',
  path: '/podcast',
  keywords: ['BDL News Podcast', 'News Podcast', 'Audio News', 'Headlines Podcast'],
})

export default async function PodcastPage() {
  const episodes = getPodcastEpisodes()
  const featured = episodes[0]

  return (
    <SiteShell showTicker>
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary tracking-[0.32em]">BDL Conversations</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Conversations shaping the future.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Listen to expert interviews, newsroom updates, and in-depth discussions on the stories driving change across technology, business, and society.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            <p className="text-xs font-black uppercase text-primary">Featured podcast</p>
            <p className="mt-4 text-sm text-muted-foreground">A modern podcast section for listeners who want context, insight, and smart analysis.</p>
          </div>
        </div>
      </section>

      <section className="jox-container py-10">
        <div className="grid gap-8 lg:grid-cols-[0.55fr_0.45fr]">
          <div className="rounded-3xl border border-border bg-white shadow-sm">
            <div className="relative aspect-[1.8] overflow-hidden bg-muted">
              <Image src={featured.image} alt={featured.title} fill className="object-cover" />
            </div>
            <div className="p-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Featured episode</p>
              <h2 className="mt-4 text-4xl font-semibold text-foreground">{featured.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{featured.description}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm uppercase text-muted-foreground">
                <span>{featured.category}</span>
                <span>{featured.duration}</span>
                <span>{featured.publishedAt}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={featured.audioUrl} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase text-primary-foreground transition hover:bg-primary/90">
                  <Play className="size-4" /> Listen online
                </Link>
                <Link href={`#episodes`} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-black uppercase text-foreground transition hover:border-primary">
                  Browse episodes
                </Link>
              </div>
            </div>
          </div>
          <aside className="space-y-5 rounded-3xl border border-border bg-card p-8">
            <div className="rounded-3xl border border-border bg-background p-5 text-sm text-muted-foreground">
              <p className="font-black uppercase text-primary">Podcast host</p>
              <p className="mt-3 text-foreground">Zama Shange</p>
              <p className="mt-3">Entrepreneur, media innovator, and founder of BDL News.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-5 text-sm text-muted-foreground">
              <p className="font-black uppercase text-primary">Featured note</p>
              <p className="mt-3">Each episode includes show notes, sharing tools, and takeaways for leaders, creators, and news fans.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="episodes" className="jox-container py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-primary">Episodes</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Latest conversations</h2>
          </div>
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Search className="size-4" /> Episode search and browse
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {episodes.map((episode) => (
            <div key={episode.id} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr] sm:items-center">
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
                  <Image src={episode.image} alt={episode.title} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-primary">{episode.category}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">{episode.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{episode.notes}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase text-muted-foreground">
                <span>{episode.duration}</span>
                <span>{episode.publishedAt}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={episode.audioUrl} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black uppercase text-primary-foreground transition hover:bg-primary/90">
                  <Play className="size-4" /> Listen
                </Link>
                <Link href={episode.audioUrl} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-black uppercase text-foreground transition hover:border-primary">
                  Share
                  <Share2 className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
