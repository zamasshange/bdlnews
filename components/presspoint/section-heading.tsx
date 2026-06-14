import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PresspointSectionHeading({
  title,
  href,
  className,
  dark = false,
}: {
  title: string
  href?: string
  className?: string
  dark?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex shrink-0 items-center gap-3">
        <span className="size-2.5 shrink-0 bg-primary" aria-hidden />
        <h2
          className={cn(
            'text-xl font-semibold tracking-tight md:text-2xl',
            dark ? 'text-white' : 'text-foreground',
          )}
        >
          {title}
        </h2>
      </div>
      <div className={cn('h-px min-w-0 flex-1', dark ? 'bg-white/15' : 'bg-border')} />
      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition hover:opacity-80"
        >
          See All
          <ArrowUpRight className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

export function PresspointMetaLine({
  category,
  date,
  categoryHref,
  className,
}: {
  category: string
  date: string
  categoryHref?: string
  className?: string
}) {
  return (
    <p className={cn('flex flex-wrap items-center gap-2 text-sm text-muted-foreground', className)}>
      {categoryHref ? (
        <Link href={categoryHref} className="font-medium transition hover:text-primary">
          {category}
        </Link>
      ) : (
        <span className="font-medium">{category}</span>
      )}
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>{date}</span>
    </p>
  )
}

export function formatPresspointDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
