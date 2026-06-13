'use client'

import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'

export default function ArticleError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <SiteShell showTicker>
      <section className="jox-container flex min-h-[50vh] flex-col items-start justify-center py-16">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Article unavailable</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-foreground md:text-5xl">
          This story could not load right now.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          The page took too long or hit a temporary server issue. Try again, or browse the latest headlines.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-xs font-black uppercase text-background transition hover:bg-primary"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-border px-5 py-3 text-xs font-black uppercase text-foreground transition hover:border-primary hover:text-primary"
          >
            Back to home
          </Link>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 border border-border px-5 py-3 text-xs font-black uppercase text-foreground transition hover:border-primary hover:text-primary"
          >
            Latest news
          </Link>
        </div>
      </section>
    </SiteShell>
  )
}
