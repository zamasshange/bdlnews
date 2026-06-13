'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void
      }
    }
  }
}

let twitterScriptPromise: Promise<void> | null = null

function loadTwitterWidgetsScript() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.twttr?.widgets) return Promise.resolve()

  if (twitterScriptPromise) return twitterScriptPromise

  twitterScriptPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector('script[data-bdl-twitter-widgets="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.dataset.bdlTwitterWidgets = 'true'
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.body.appendChild(script)
  })

  return twitterScriptPromise
}

export function TwitterEmbed({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    loadTwitterWidgetsScript().then(() => {
      if (!active || !containerRef.current) return
      window.twttr?.widgets.load(containerRef.current)
    })

    return () => {
      active = false
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className="my-8 flex w-full justify-center [&_.twitter-tweet]:!mx-auto [&_.twitter-tweet]:!max-w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function TwitterFallbackLink({ url }: { url: string }) {
  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Post on X</p>
        <p className="mt-2 text-sm text-muted-foreground">This post is hosted on X (formerly Twitter).</p>
      </div>
      <div className="px-5 py-4">
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition hover:text-primary"
        >
          Open post on X
        </Link>
      </div>
    </div>
  )
}
