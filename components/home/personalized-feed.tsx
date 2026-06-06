'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { Reveal, SectionHeader } from '@/components/reveal'
import { ArticleCard } from '@/components/article-card'
import { articles, type Category } from '@/lib/data'
import { cn } from '@/lib/utils'

const TOPICS: (Category | 'For You')[] = [
  'For You',
  'Politics',
  'Technology',
  'Sports',
  'Business',
  'Entertainment',
]

export function PersonalizedFeed() {
  const [active, setActive] = useState<(typeof TOPICS)[number]>('For You')

  const filtered =
    active === 'For You'
      ? articles.slice(0, 6)
      : articles.filter((a) => a.category === active)

  const list = filtered.length ? filtered : articles.slice(0, 3)

  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionHeader
            kicker="Personalized"
            title="Recommended For You"
            description="Tuned to your reading habits across every topic — refined by BDL’s recommendation engine."
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" /> AI-curated
              </span>
            }
          />
        </Reveal>

        <Reveal>
          <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition',
                  active === t
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {list.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
