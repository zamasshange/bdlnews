'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import type { LiveItem } from '@/lib/data'
import { headlineLimits, shortHeadline } from '@/lib/headlines'

export function LiveUpdatesPanel({ initialItems }: { initialItems: LiveItem[] }) {
  const [items, setItems] = useState(initialItems)

  async function load() {
    const response = await fetch('/api/live-updates')
    const payload = await response.json()
    setItems(payload.updates ?? [])
  }

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel('public-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_updates' }, () => {
        void load()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="border border-border">
      {items.slice(0, 6).map((item) => (
        <div
          key={item.id}
          className="grid gap-3 border-b border-border p-4 last:border-0 sm:grid-cols-[70px_110px_1fr]"
        >
          <span className="font-mono text-xs text-muted-foreground">{item.time}</span>
          <span className="text-xs font-black uppercase text-primary">{item.status}</span>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {shortHeadline(item.headline, headlineLimits.compact)}
          </p>
        </div>
      ))}
    </div>
  )
}
