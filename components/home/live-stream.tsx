'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Radio } from 'lucide-react'
import { Reveal, SectionHeader } from '@/components/reveal'
import { liveFeed, type LiveItem, type Status } from '@/lib/data'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<Status, string> = {
  LIVE: 'bg-live/15 text-live',
  BREAKING: 'bg-breaking/15 text-breaking',
  UPDATED: 'bg-primary/15 text-primary',
}

const EXTRA: Omit<LiveItem, 'time'>[] = [
  { id: 'x1', category: 'World', headline: 'Officials announce follow-up summit for September', status: 'UPDATED' },
  { id: 'x2', category: 'Technology', headline: 'Open-source community releases first benchmark results', status: 'LIVE' },
  { id: 'x3', category: 'Business', headline: 'Currency markets steady after coordinated statement', status: 'UPDATED' },
  { id: 'x4', category: 'Sports', headline: 'Coach confirms starting eleven for the final', status: 'BREAKING' },
]

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function LiveStream() {
  const [items, setItems] = useState<LiveItem[]>(liveFeed)

  useEffect(() => {
    fetch('/api/live-updates')
      .then((res) => res.json())
      .then((payload) => {
        if (payload.updates?.length) setItems(payload.updates)
      })
      .catch(() => undefined)

    let i = 0
    const interval = setInterval(() => {
      const next = EXTRA[i % EXTRA.length]
      i++
      setItems((prev) => [{ ...next, id: `${next.id}-${Date.now()}`, time: nowTime() }, ...prev].slice(0, 8))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Reveal>
        <SectionHeader
          kicker="Live"
          title="Live News Stream"
          description="A continuously updating wire of verified developments as they happen."
          action={
            <span className="inline-flex items-center gap-2 rounded-full bg-live/10 px-3 py-1.5 text-xs font-semibold text-live">
              <span className="size-2 rounded-full bg-live live-dot" /> Streaming now
            </span>
          }
        />
      </Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0, backgroundColor: 'var(--primary)' }}
                animate={{ opacity: 1, height: 'auto', backgroundColor: 'rgba(0,0,0,0)' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0 sm:px-5"
              >
                <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
                  {item.time}
                </span>
                <span
                  className={cn(
                    'flex w-24 shrink-0 items-center justify-center gap-1 rounded-full py-1 text-[10px] font-bold uppercase tracking-wide',
                    STATUS_STYLE[item.status],
                  )}
                >
                  {item.status === 'LIVE' && <Radio className="size-3" />}
                  {item.status}
                </span>
                <span className="hidden w-24 shrink-0 text-xs font-semibold uppercase tracking-wide text-primary sm:block">
                  {item.category}
                </span>
                <span className="line-clamp-1 flex-1 text-sm text-foreground">
                  {item.headline}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  )
}
