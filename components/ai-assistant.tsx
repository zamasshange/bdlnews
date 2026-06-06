'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, X, ArrowUp, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Msg {
  role: 'user' | 'assistant'
  text: string
}

const QUICK = [
  'Summarize the latest headlines',
  'Show me technology news',
  'Explain why this matters',
  'What are the biggest stories today?',
]

export function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: 'Hi, I’m Sonke — your AI-powered news assistant. Ask me to summarize headlines, explain stories, or filter news for what matters to you.',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send(text: string) {
    if (!text.trim()) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/sonke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const payload = await response.json()
      const reply = payload.text || payload.error || 'Sonke could not answer that right now.'
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Something went wrong while connecting to Sonke. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Open Sonke assistant"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-xl shadow-primary/30"
        initial={{ scale: 0 }}
        animate={{ scale: open ? 0 : 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        <Sparkles className="size-5" />
        <span className="hidden text-sm font-semibold sm:block">Ask Sonke</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-5 right-5 z-50 flex h-[34rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          >
            <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">Sonke</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-positive" /> Live
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] text-pretty rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted text-foreground',
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {isLoading && (
                <div className="mb-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Sonke is summarizing the latest answer...
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about any story…"
                  disabled={isLoading}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/70"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={isLoading}
                  className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowUp className="size-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
