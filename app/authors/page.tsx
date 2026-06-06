import Link from 'next/link'
import Image from 'next/image'
import { SiteShell } from '@/components/site-shell'
import { getAuthorDirectory } from '@/lib/news'

export const dynamic = 'force-dynamic'

export default async function AuthorsPage() {
  const authors = await getAuthorDirectory()

  return (
    <SiteShell showTicker>
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary tracking-[0.32em]">Authors</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Meet the journalists shaping BDL News.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              The author directory includes writers, correspondents, and newsroom leaders who bring African and global stories to life.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            <p className="text-xs font-black uppercase text-primary">Directory</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Browse profiles by expertise, published articles, and newsroom focus areas.
            </p>
          </div>
        </div>
      </section>

      <section className="jox-container grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {authors.map((author) => (
          <div key={author.id} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <div className="relative mb-5 aspect-square overflow-hidden rounded-3xl bg-muted">
              <Image src={author.profileImage} alt={author.name} fill className="object-cover" />
            </div>
            <p className="text-xs font-black uppercase text-primary">{author.role}</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">{author.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>
            <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Expertise:</span> {author.expertise.join(', ')}</p>
              <p><span className="font-semibold text-foreground">Articles:</span> {author.articles}</p>
              <p><span className="font-semibold text-foreground">Views:</span> {author.views.toLocaleString()}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {author.socialLinks.x ? (
                <Link href={author.socialLinks.x} className="rounded-full border border-border px-3 py-2 text-xs uppercase text-muted-foreground transition hover:border-primary hover:text-primary">
                  X
                </Link>
              ) : null}
              {author.socialLinks.linkedin ? (
                <Link href={author.socialLinks.linkedin} className="rounded-full border border-border px-3 py-2 text-xs uppercase text-muted-foreground transition hover:border-primary hover:text-primary">
                  LinkedIn
                </Link>
              ) : null}
              {author.socialLinks.website ? (
                <Link href={author.socialLinks.website} className="rounded-full border border-border px-3 py-2 text-xs uppercase text-muted-foreground transition hover:border-primary hover:text-primary">
                  Website
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </SiteShell>
  )
}
