'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Eye, Zap, TrendingUp } from 'lucide-react'
import { Reveal, SectionHeader } from '@/components/reveal'
import { articles, formatCount } from '@/lib/data'
import { Button } from '@/components/ui/button'

export function Trending() {
  const ref = useRef<HTMLDivElement>(null)

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionHeader
            kicker="Trending Now"
            title="What the world is reading"
            action={
              <div className="hidden gap-2 sm:flex">
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => scroll(-1)} aria-label="Scroll left">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => scroll(1)} aria-label="Scroll right">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            }
          />
        </Reveal>

        <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {articles.map((a, i) => (
            <Link
              key={a.slug}
              href={`/article/${a.slug}`}
              className="group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40"
            >
              <span className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-background/90 font-heading text-lg font-bold text-primary backdrop-blur">
                {i + 1}
              </span>
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={a.image || '/placeholder.svg'}
                  alt={a.title}
                  fill
                  sizes="300px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {a.category}
                </span>
                <h3 className="mt-1 line-clamp-2 text-balance font-heading text-base font-semibold leading-snug transition group-hover:text-primary">
                  {a.title}
                </h3>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" /> {formatCount(a.readers)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="size-3" /> {a.engagement}
                  </span>
                  <span className="ml-auto flex items-center gap-1 font-medium text-positive">
                    <TrendingUp className="size-3" /> +{a.trendDelta}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
