import Link from 'next/link'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import type { Article } from '@/lib/data'

export function ArticleSourceCredit({ article }: { article: Article }) {
  if (!article.externalUrl) return null

  const sourceName = article.author || 'the original publisher'

  return (
    <section className="jox-container py-8">
      <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">Source Credit</p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
          Originally reported by {sourceName}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          BDL News presents this story on our platform with summary and context. The full reporting belongs to {sourceName}.
          Visit the original publisher to read the complete article and support their journalism.
        </p>
        <a
          href={article.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-black uppercase text-background transition hover:bg-primary"
        >
          Visit {sourceName}
          <ExternalLink className="size-4" />
        </a>
        <p className="mt-4 text-xs text-muted-foreground">
          Syndicated via BDL wire •{' '}
          <Link href="/news" className="font-semibold text-primary transition hover:underline">
            Browse more headlines
          </Link>
        </p>
      </div>
    </section>
  )
}
