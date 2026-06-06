'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Star, MessageSquare, Rocket, Smile, Flame, ArrowUpRight } from 'lucide-react'
import { Reveal, SectionHeader } from '@/components/reveal'
import { articles, formatCount } from '@/lib/data'

const PULSE = [
  {
    label: 'Most Important',
    icon: Star,
    article: articles[0],
    metric: '94 impact score',
    tint: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Most Discussed',
    icon: MessageSquare,
    article: articles[5],
    metric: '38.2K comments',
    tint: 'text-chart-5',
    bg: 'bg-chart-5/10',
  },
  {
    label: 'Fastest Growing',
    icon: Rocket,
    article: articles[1],
    metric: '+52% in 1h',
    tint: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    label: 'Most Positive',
    icon: Smile,
    article: articles[6],
    metric: '96% positive',
    tint: 'text-positive',
    bg: 'bg-positive/10',
  },
  {
    label: 'Most Controversial',
    icon: Flame,
    article: articles[2],
    metric: 'Split sentiment',
    tint: 'text-breaking',
    bg: 'bg-breaking/10',
  },
]

export function Pulse() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Reveal>
        <SectionHeader
          kicker="BDL Pulse"
          title="The day, distilled"
          description="A real-time read on what matters most — the stories driving impact, conversation, momentum, and mood across the globe."
        />
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PULSE.map((p, i) => {
          const Icon = p.icon
          const span = i === 0 ? 'lg:col-span-1 lg:row-span-2' : ''
          return (
            <Reveal key={p.label} delay={i * 0.06} className={span}>
              <motion.div whileHover={{ y: -4 }} className="h-full">
                <Link
                  href={`/article/${p.article.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 rounded-full ${p.bg} px-3 py-1 text-xs font-semibold ${p.tint}`}>
                      <Icon className="size-3.5" />
                      {p.label}
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="mt-4">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {p.article.category}
                    </span>
                    <h3 className={`text-balance font-heading font-semibold leading-snug tracking-tight transition group-hover:text-primary ${i === 0 ? 'text-xl' : 'text-base'}`}>
                      {p.article.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className={`font-semibold ${p.tint}`}>{p.metric}</span>
                    <span>{formatCount(p.article.readers)} readers</span>
                  </div>
                </Link>
              </motion.div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
