'use client'

import { useEffect } from 'react'

export function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
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
  }, [articleId])

  return null
}
