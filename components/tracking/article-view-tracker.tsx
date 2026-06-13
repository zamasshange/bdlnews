'use client'

import { useEffect } from 'react'
import { AnalyticsEvents, trackEvent } from '@/lib/analytics'

function isDatabaseArticleId(articleId: string) {
  if (!articleId || articleId.startsWith('ext-')) return false
  return /^\d+$/.test(articleId) || /^[0-9a-f-]{36}$/i.test(articleId)
}

export function ArticleViewTracker({
  articleId,
  slug,
  title,
  category,
  author,
}: {
  articleId: string
  slug?: string
  title?: string
  category?: string
  author?: string
}) {
  useEffect(() => {
    trackEvent(AnalyticsEvents.articleView, {
      article_id: articleId,
      slug,
      title,
      category,
      author,
      referrer: document.referrer || null,
    })

    if (!isDatabaseArticleId(articleId)) return

    const startedAt = Date.now()
    const track = () => {
      navigator.sendBeacon?.(
        '/api/article-views',
        new Blob(
          [
            JSON.stringify({
              articleId,
              source: document.referrer || null,
              readingTimeSeconds: Math.round((Date.now() - startedAt) / 1000),
            }),
          ],
          { type: 'application/json' },
        ),
      )
    }

    fetch('/api/article-views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articleId, source: document.referrer || null }),
      keepalive: true,
    }).catch(() => undefined)

    window.addEventListener('pagehide', track)
    return () => window.removeEventListener('pagehide', track)
  }, [articleId, slug, title, category, author])

  return null
}
