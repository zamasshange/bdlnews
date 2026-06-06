'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { breakingTicker } from '@/lib/data'

export function BreakingTicker() {
  const [ticker, setTicker] = useState(breakingTicker)

  useEffect(() => {
    fetch('/api/external-news?provider=all')
      .then((res) => res.json())
      .then((payload) => {
        const headlines = payload.articles?.map((item: { title: string }) => item.title).filter(Boolean)
        if (headlines?.length) setTicker(headlines)
      })
      .catch(() => {
        fetch('/api/live-updates')
          .then((res) => res.json())
          .then((payload) => {
            const headlines = payload.updates?.map((item: { headline: string }) => item.headline).filter(Boolean)
            if (headlines?.length) setTicker(headlines)
          })
          .catch(() => undefined)
      })
  }, [])

  const items = [...ticker, ...ticker]
  return (
    <div className="relative flex items-center overflow-hidden border-b border-border bg-primary text-primary-foreground">
      <div className="z-10 shrink-0 bg-foreground px-4 py-2 font-heading text-2xl leading-none text-primary md:px-6">
        Latest
      </div>
      <div className="flex overflow-hidden">
        <motion.div
          className="flex shrink-0 items-center gap-7 whitespace-nowrap pr-7 text-sm font-black uppercase"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 34, ease: 'linear', repeat: Infinity }}
        >
          {items.map((t, i) => (
            <span key={i} className="flex items-center gap-7">
              {t}
              <span className="font-heading text-2xl leading-none">*</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
