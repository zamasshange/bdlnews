'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

function getProjectKey() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? ''
  if (!key || key.includes('personal_api_key') || key.startsWith('phx_')) return ''
  if (!key.startsWith('phc_')) return ''
  return key
}

function initPostHog() {
  const apiKey = getProjectKey()
  if (!apiKey || typeof window === 'undefined' || posthog.__loaded) return Boolean(posthog.__loaded)

  posthog.init(apiKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  })

  return true
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return

    const query = searchParams?.toString()
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const projectKey = getProjectKey()

  useEffect(() => {
    setReady(initPostHog())
  }, [])

  if (!projectKey) {
    return <>{children}</>
  }

  if (!ready) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
