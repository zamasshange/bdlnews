'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { AnalyticsEvents, identifyUser, trackEvent } from '@/lib/analytics'

export function AdminAnalyticsTracker({
  userId,
  userName,
  role,
}: {
  userId: string
  userName: string
  role: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const identifiedRef = useRef(false)
  const dashboardTrackedRef = useRef(false)

  useEffect(() => {
    if (!userId || identifiedRef.current) return
    identifyUser(userId, { name: userName, role, area: 'admin' })
    identifiedRef.current = true
  }, [userId, userName, role])

  useEffect(() => {
    if (searchParams.get('login') === 'success') {
      trackEvent(AnalyticsEvents.adminLogin, { role, path: pathname })
      const url = new URL(window.location.href)
      url.searchParams.delete('login')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, pathname, role])

  useEffect(() => {
    if (pathname !== '/admin' || dashboardTrackedRef.current) return
    trackEvent(AnalyticsEvents.dashboardOpened, { role })
    dashboardTrackedRef.current = true
  }, [pathname, role])

  return null
}
