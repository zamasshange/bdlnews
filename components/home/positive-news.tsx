'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Sun, Sprout, Heart, Brain } from 'lucide-react'
import { Reveal, SectionHeader } from '@/components/reveal'
import { articles } from '@/lib/data'

const POSITIVE = articles.filter((a) => a.sentiment === 'positive').slice(0, 4)
const ICONS = [Sprout, Brain, Heart, Sun]

export function PositiveNews() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 rounded-full bg-positive/10 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionHeader
            kicker="Positive News"
            title="Good things are happening"
            description="A dedicated antidote to doom-scrolling — human achievements, scientific breakthroughs, and stories of progress."
            action={
              <span className="inline-flex items-center gap-2 rounded-full bg-positive/10 px-3 py-1.5 text-xs font-semibold text-positive">
                <Sun className="size-3.5" /> Brighter side
              </span>
            }
          />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {POSITIVE.map((a, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Reveal key={a.slug} delay={i * 0.06}>
                <motion.div whileHover={{ y: -4 }}>
                  <Link
                    href={`/article/${a.slug}`}
                    className="group flex gap-4 rounded-2xl border border-positive/20 bg-card p-4 transition hover:border-positive/50 hover:shadow-lg hover:shadow-positive/5"
                  >
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={a.image || '/placeholder.svg'}
                        alt={a.title}
                        fill
                        sizes="96px"
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-positive">
                        <Icon className="size-3.5" /> {a.category}
                      </span>
                      <h3 className="line-clamp-2 text-balance font-heading text-base font-semibold leading-snug transition group-hover:text-positive">
                        {a.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {a.dek}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
