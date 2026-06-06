'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowRight, Radio, TrendingUp, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { articles, trendingTopics, formatCount } from '@/lib/data'

function useCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setValue(Math.floor(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export function Hero() {
  const featured = articles[0]
  const side = articles.slice(1, 3)
  const liveStories = useCounter(1284)
  const sources = useCounter(940)

  return (
    <section className="relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 size-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-32 top-40 size-[24rem] rounded-full bg-chart-2/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-live">
                <Radio className="size-3.5" /> Live
              </span>
              <span className="h-3 w-px bg-border" />
              Global News Pulse · Updated continuously
            </p>
            <h1 className="max-w-2xl text-balance font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Understand More.{' '}
              <span className="text-primary">Scroll Less.</span>
            </h1>
          </div>
          <div className="flex gap-6">
            <Stat label="Live stories" value={`${formatCount(liveStories)}`} icon={<TrendingUp className="size-4" />} />
            <Stat label="Verified sources" value={`${formatCount(sources)}`} icon={<Globe2 className="size-4" />} />
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Featured */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Link
              href={`/article/${featured.slug}`}
              className="group relative block h-full min-h-[24rem] overflow-hidden rounded-3xl border border-border"
            >
              <Image
                src={featured.image || '/placeholder.svg'}
                alt={featured.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-breaking px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-breaking-foreground">
                    Featured
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {featured.category}
                  </span>
                </div>
                <h2 className="max-w-2xl text-balance font-heading text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/80">
                  {featured.dek}
                </p>
                <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
                  <span>{featured.author}</span>
                  <span className="size-1 rounded-full bg-white/40" />
                  <span>{featured.readingTime} min read</span>
                  <span className="ml-auto hidden items-center gap-1 font-medium text-white group-hover:flex">
                    Read story <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Side stories + trending */}
          <div className="flex flex-col gap-4">
            {side.map((a, i) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <Link
                  href={`/article/${a.slug}`}
                  className="group relative flex h-32 overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="relative w-32 shrink-0 overflow-hidden">
                    <Image
                      src={a.image || '/placeholder.svg'}
                      alt={a.title}
                      fill
                      sizes="128px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-3">
                    <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {a.category}
                    </span>
                    <h3 className="line-clamp-3 text-balance text-sm font-semibold leading-snug transition group-hover:text-primary">
                      {a.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="size-4 text-primary" /> Trending Topics
              </p>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((t) => (
                  <span
                    key={t}
                    className="cursor-pointer rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-1.5 font-heading text-2xl font-semibold tracking-tight">
        <span className="text-primary">{icon}</span>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
