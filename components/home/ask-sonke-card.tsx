'use client'

import { Sparkles } from 'lucide-react'

export function AskSonkeCard() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent('sonke:ask', {
            detail: { message: 'Summarize the biggest stories on BDL News right now.' },
          }),
        )
      }
      className="group w-full rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-md"
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ask Sonke</p>
      <h2 className="mt-4 text-2xl font-semibold text-foreground transition group-hover:text-primary">
        Need quick headlines or a filtered feed?
      </h2>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Sonke can summarize the top stories, surface the best technology news, or show you the latest business and Africa updates in seconds.
      </p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground transition group-hover:scale-[1.02]">
        <Sparkles className="size-3.5" />
        Chat with Sonke
      </div>
    </button>
  )
}
