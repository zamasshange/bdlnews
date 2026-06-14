'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { breakingTicker } from '@/lib/data'
import { headlineLimits, shortHeadline } from '@/lib/headlines'

export function BreakingTicker() {
  const [ticker, setTicker] = useState(breakingTicker)

  useEffect(() => {
    fetch('/api/external-news?provider=all')
      .then((res) => res.json())
      .then((payload) => {
        const headlines = payload.articles
          ?.map((item: { title: string }) => shortHeadline(item.title, headlineLimits.ticker))
          .filter(Boolean)
        if (headlines?.length) setTicker(headlines)
      })
      .catch(() => {
        fetch('/api/live-updates')
          .then((res) => res.json())
          .then((payload) => {
            const headlines = payload.updates
              ?.map((item: { headline: string }) => shortHeadline(item.headline, headlineLimits.ticker))
              .filter(Boolean)
            if (headlines?.length) setTicker(headlines)
          })
          .catch(() => undefined)
      })
  }, [])

  const items = [...ticker, ...ticker]

  return (
    <div className="overflow-hidden bg-primary text-primary-foreground">
      <div className="flex overflow-hidden py-3">
        <motion.div
          className="flex shrink-0 items-center gap-6 whitespace-nowrap px-4 text-sm font-medium"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
        >
          {items.map((headline, index) => (
            <span key={index} className="flex items-center gap-6">
              {headline}
              <span className="size-1.5 rounded-sm bg-primary-foreground/80" />
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
