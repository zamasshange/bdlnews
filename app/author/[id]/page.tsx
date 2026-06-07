import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { SiteShell } from '@/components/site-shell'
import { JsonLd } from '@/components/seo/json-ld'
import { formatCount } from '@/lib/data'
import { getAuthorProfile } from '@/lib/news'
import { breadcrumbJsonLd, buildPageMetadata, personJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getAuthorProfile(id)
  if (!profile) return {}
  return buildPageMetadata({
    title: profile.author.name,
    description:
      profile.author.bio ??
      `Read articles by ${profile.author.name}, ${profile.author.role} at BDL News — independent South African and African digital news.`,
    path: `/author/${id}`,
    keywords: [profile.author.name, profile.author.role, 'BDL News Authors', 'Journalist'],
    ogImage: profile.author.profile_image,
  })
}

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getAuthorProfile(id)
  if (!profile) notFound()

  return (
    <SiteShell showTicker>
      <JsonLd
        data={[
          personJsonLd({
            id: profile.author.id,
            name: profile.author.name,
            bio: profile.author.bio,
            role: profile.author.role,
            profileImage: profile.author.profile_image,
            socialLinks: profile.author.social_links,
          }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Authors', path: '/authors' },
            { name: profile.author.name, path: `/author/${profile.author.id}` },
          ]),
        ]}
      />
      <section className="jox-container py-8 md:py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase text-muted-foreground transition hover:text-primary">
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <div className="grid gap-8 border-b border-border pb-8 lg:grid-cols-[0.2fr_0.8fr]">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {profile.author.profile_image && (
              <Image src={profile.author.profile_image} alt={profile.author.name} fill sizes="220px" className="object-cover" />
            )}
          </div>
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary">{profile.author.role ?? 'Author'}</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">{profile.author.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{profile.author.bio}</p>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3 text-xs uppercase text-muted-foreground">
              <div><p className="font-black text-foreground">{profile.stats.articles}</p><p>Articles</p></div>
              <div><p className="font-black text-foreground">{formatCount(profile.stats.views)}</p><p>Views</p></div>
              <div><p className="font-black text-foreground">{profile.stats.comments}</p><p>Comments</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="jox-container grid gap-5 pb-14 md:grid-cols-3">
        {profile.articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </section>
    </SiteShell>
  )
}
