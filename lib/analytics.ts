import posthog from 'posthog-js'

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

export const AnalyticsEvents = {
  articleView: 'article_view',
  articleCreated: 'article_created',
  adminLogin: 'admin_login',
  aiArticleGenerated: 'ai_article_generated',
  dashboardOpened: 'dashboard_opened',
} as const

export function isPostHogReady() {
  return typeof window !== 'undefined' && Boolean(posthog.__loaded)
}

export function trackEvent(eventName: string, properties?: AnalyticsProperties) {
  if (!isPostHogReady()) return
  posthog.capture(eventName, properties)
}

export function identifyUser(userId: string, properties?: AnalyticsProperties) {
  if (!isPostHogReady()) return
  posthog.identify(userId, properties)
}

export function resetUser() {
  if (!isPostHogReady()) return
  posthog.reset()
}
