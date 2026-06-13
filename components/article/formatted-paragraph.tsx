'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TwitterEmbed } from '@/components/embeds/twitter-embed'
import { parseInlineContent, type ContentSegment } from '@/lib/content-segments'
import { cn } from '@/lib/utils'

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition hover:text-foreground hover:decoration-primary"
    >
      {children}
    </a>
  )
}

function TwitterEmbedLazy({ url }: { url: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const href = url.startsWith('http') ? url : `https://${url}`

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    fetch(`/api/embed/twitter?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('embed unavailable')
        return response.json() as Promise<{ html?: string }>
      })
      .then((payload) => {
        if (!active) return
        if (payload.html) setHtml(payload.html)
        else setFailed(true)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [url])

  if (failed) {
    return (
      <div className="my-8 overflow-hidden rounded-3xl border border-primary/20 bg-primary/5">
        <div className="border-b border-primary/15 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Post on X</p>
        </div>
        <div className="px-5 py-4">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-foreground"
          >
            Open post on X
          </Link>
        </div>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="my-8 animate-pulse rounded-3xl border border-border bg-card p-8">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-4 h-24 rounded bg-muted" />
      </div>
    )
  }

  return <TwitterEmbed html={html} />
}

function renderSegment(segment: ContentSegment, index: number) {
  if (segment.kind === 'twitter') {
    return <TwitterEmbedLazy key={`twitter-${index}`} url={segment.value} />
  }

  if (segment.kind === 'link') {
    return (
      <InlineLink key={`link-${index}`} href={segment.href}>
        {segment.value}
      </InlineLink>
    )
  }

  return <span key={`text-${index}`}>{segment.value}</span>
}

export function FormattedParagraph({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const segments = parseInlineContent(text)
  const hasBlockEmbed = segments.some((segment) => segment.kind === 'twitter')

  if (hasBlockEmbed) {
    return (
      <div className={cn('space-y-4', className)}>
        {segments.map((segment, index) => {
          if (segment.kind === 'twitter') {
            return <TwitterEmbedLazy key={`block-twitter-${index}`} url={segment.value} />
          }

          if (segment.kind === 'link') {
            return (
              <p key={`block-link-${index}`} className={className}>
                <InlineLink href={segment.href}>{segment.value}</InlineLink>
              </p>
            )
          }

          if (!segment.value.trim()) return null

          return (
            <p key={`block-text-${index}`} className={className}>
              {segment.value}
            </p>
          )
        })}
      </div>
    )
  }

  return <p className={className}>{segments.map((segment, index) => renderSegment(segment, index))}</p>
}
