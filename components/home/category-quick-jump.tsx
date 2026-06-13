'use client'

import Link from 'next/link'
import { NAV_LINKS } from '@/lib/data'
import { categoryPathFromName } from '@/lib/category-paths'

const QUICK_LINKS = NAV_LINKS.filter((item) => item !== 'Home')

export function CategoryQuickJump() {
  return (
    <div className="border-b border-border bg-background">
      <div className="jox-container flex gap-3 overflow-x-auto py-4 no-scrollbar">
        {QUICK_LINKS.map((category) => (
          <Link
            key={category}
            href={categoryPathFromName(category)}
            className="shrink-0 border border-border bg-card px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            {category === 'AI News' ? 'BDL Signal' : category}
          </Link>
        ))}
      </div>
    </div>
  )
}
