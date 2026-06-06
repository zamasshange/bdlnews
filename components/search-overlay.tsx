'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Sparkles, ArrowUpRight, TrendingUp } from 'lucide-react'
import { type Article } from '@/lib/data'

const SUGGESTIONS = [
  'What happened in South Africa today?',
  'Show me technology breakthroughs this week',
  'Summarize the biggest global stories',
  'Positive news from the last 24 hours',
]

export function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'internal' | 'external' | 'all'>('all')
  const [articles, setArticles] = useState<Article[]>([])
  const [topics, setTopics] = useState<string[]>([])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    params.set('source', source)

    fetch(`/api/articles?${params.toString()}`)
      .then((res) => res.json())
      .then((payload) => {
        setArticles(payload.articles ?? [])
      })
      .catch(() => undefined)
  }, [query, source])

  useEffect(() => {
    fetch('/api/trending')
      .then((res) => res.json())
      .then((payload) => setTopics((payload.articles ?? []).map((article: Article) => article.title).slice(0, 6)))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  const results = query ? articles : articles.slice(0, 4)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border shadow-2xl"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Sparkles className="size-5 shrink-0 text-primary" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything — natural language news search"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-3">
              {!query && (
                <>
                  <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Try asking
                  </p>
                  <div className="mb-3 grid gap-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent"
                      >
                        <Search className="size-4 text-muted-foreground" />
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 px-3 pb-2">
                    {topics.map((t) => (
                      <button
                        key={t}
                        onClick={() => setQuery(t)}
                        className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        <TrendingUp className="size-3" />
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
                {(['all', 'internal', 'external'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSource(option)}
                    className={
                      source === option
                        ? 'rounded-full border border-primary bg-primary px-3 py-1 text-[11px] font-semibold uppercase text-background'
                        : 'rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase text-muted-foreground hover:border-primary hover:text-primary'
                    }
                  >
                    {option === 'all' ? 'All news' : option === 'internal' ? 'Published stories' : 'External headlines'}
                  </button>
                ))}
              </div>

              <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {query ? `Results for “${query}”` : source === 'external' ? 'External headlines' : 'Top stories'}
              </p>
              <div className="grid gap-1">
                {results.map((a) => {
                  const key = a.externalUrl ?? a.slug
                  const isExternal = Boolean(a.externalUrl)
                  return isExternal ? (
                    <a
                      key={key}
                      href={a.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent"
                    >
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {a.category}
                      </span>
                      <span className="line-clamp-1 flex-1 text-sm text-foreground">
                        {a.title}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </a>
                  ) : (
                    <Link
                      key={key}
                      href={`/article/${a.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent"
                    >
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {a.category}
                      </span>
                      <span className="line-clamp-1 flex-1 text-sm text-foreground">
                        {a.title}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  )
                })}
                {results.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No stories found. Try a broader query.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
