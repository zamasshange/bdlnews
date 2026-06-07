import 'server-only'

type HogQLRow = Record<string, string | number | null>

export type PostHogDashboardStats = {
  configured: boolean
  error?: string
  pageviews7d: number
  visitors7d: number
  pageviewsToday: number
  articleViews7d: number
  topPages: { path: string; views: number }[]
  dailyPageviews: { day: string; views: number }[]
  recentEvents: { event: string; count: number }[]
}

function getApiKey() {
  return process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
}

function getApiHost() {
  const host = process.env.POSTHOG_API_HOST ?? 'https://us.posthog.com'
  return host.replace(/\/$/, '').replace('us.i.posthog.com', 'us.posthog.com')
}

async function posthogFetch(path: string, init?: RequestInit) {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const response = await fetch(`${getApiHost()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || `PostHog request failed: ${response.status}`)
  }

  return response.json()
}

async function getProjectId() {
  if (process.env.POSTHOG_PROJECT_ID) return process.env.POSTHOG_PROJECT_ID

  const payload = await posthogFetch('/api/projects/')
  const projects = payload?.results ?? []
  return projects[0]?.id ? String(projects[0].id) : null
}

async function runHogQL(query: string) {
  const projectId = await getProjectId()
  if (!projectId) return []

  const payload = await posthogFetch(`/api/projects/${projectId}/query/`, {
    method: 'POST',
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query,
      },
    }),
  })

  const columns: string[] = payload?.columns ?? []
  const results: unknown[][] = payload?.results ?? []

  return results.map((row) =>
    columns.reduce<HogQLRow>((acc, column, index) => {
      acc[column] = row[index] as string | number | null
      return acc
    }, {}),
  )
}

function readCount(rows: HogQLRow[], key = 'count') {
  const value = rows[0]?.[key]
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export async function getPostHogDashboardStats(): Promise<PostHogDashboardStats> {
  const empty: PostHogDashboardStats = {
    configured: false,
    pageviews7d: 0,
    visitors7d: 0,
    pageviewsToday: 0,
    articleViews7d: 0,
    topPages: [],
    dailyPageviews: [],
    recentEvents: [],
  }

  if (!getApiKey()) {
    return { ...empty, error: 'PostHog API key is not configured.' }
  }

  try {
    const [pageviews7dRows, visitors7dRows, pageviewsTodayRows, articleViewsRows, topPagesRows, dailyRows, eventRows] =
      await Promise.all([
        runHogQL(`SELECT count() AS count FROM events WHERE event = '$pageview' AND timestamp > now() - interval 7 day`),
        runHogQL(`SELECT count(DISTINCT person_id) AS count FROM events WHERE event = '$pageview' AND timestamp > now() - interval 7 day`),
        runHogQL(`SELECT count() AS count FROM events WHERE event = '$pageview' AND timestamp > now() - interval 1 day`),
        runHogQL(`SELECT count() AS count FROM events WHERE event = 'article_view' AND timestamp > now() - interval 7 day`),
        runHogQL(`
          SELECT properties.$pathname AS path, count() AS views
          FROM events
          WHERE event = '$pageview' AND timestamp > now() - interval 7 day
          GROUP BY path
          ORDER BY views DESC
          LIMIT 8
        `),
        runHogQL(`
          SELECT formatDateTime(toStartOfDay(timestamp), '%Y-%m-%d') AS day, count() AS views
          FROM events
          WHERE event = '$pageview' AND timestamp > now() - interval 7 day
          GROUP BY day
          ORDER BY day ASC
        `),
        runHogQL(`
          SELECT event, count() AS count
          FROM events
          WHERE timestamp > now() - interval 7 day
            AND event IN ('$pageview', 'article_view', 'dashboard_opened', 'admin_login', 'article_created')
          GROUP BY event
          ORDER BY count DESC
        `),
      ])

    return {
      configured: true,
      pageviews7d: readCount(pageviews7dRows),
      visitors7d: readCount(visitors7dRows),
      pageviewsToday: readCount(pageviewsTodayRows),
      articleViews7d: readCount(articleViewsRows),
      topPages: topPagesRows
        .map((row) => ({
          path: String(row.path ?? '/'),
          views: Number(row.views ?? 0),
        }))
        .filter((row) => row.path && row.path !== 'null'),
      dailyPageviews: dailyRows.map((row) => ({
        day: String(row.day ?? ''),
        views: Number(row.views ?? 0),
      })),
      recentEvents: eventRows.map((row) => ({
        event: String(row.event ?? ''),
        count: Number(row.count ?? 0),
      })),
    }
  } catch (error) {
    return {
      ...empty,
      configured: true,
      error: error instanceof Error ? error.message : 'Unable to load PostHog analytics.',
    }
  }
}
