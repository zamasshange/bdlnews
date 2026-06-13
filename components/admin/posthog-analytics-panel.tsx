import Link from 'next/link'
import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { AdminTable, StatCard, Td, Th } from '@/components/admin/ui'
import { formatCount } from '@/lib/data'
import { getPostHogDashboardStats } from '@/lib/posthog-server'

export async function PostHogAnalyticsPanel({ compact = false }: { compact?: boolean }) {
  const stats = await getPostHogDashboardStats()

  if (!stats.configured || stats.error) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">PostHog analytics unavailable</p>
        <p className="mt-2">
          {stats.error ?? 'Add NEXT_PUBLIC_POSTHOG_KEY or POSTHOG_API_KEY to your environment variables.'}
        </p>
        <p className="mt-3 text-xs">
          Set `NEXT_PUBLIC_POSTHOG_KEY` to your project key (`phc_...`) for pageview capture, and `POSTHOG_API_KEY` to a personal API key (`phx_...`) for dashboard queries.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">PostHog Live</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {compact ? 'Visitor analytics' : 'Audience analytics from PostHog'}
          </h2>
        </div>
        <Link
          href="/admin/analytics"
          className="text-xs font-black uppercase text-primary transition hover:underline"
        >
          Open full analytics
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pageviews (7d)" value={formatCount(stats.pageviews7d)} />
        <StatCard label="Unique Visitors (7d)" value={formatCount(stats.visitors7d)} />
        <StatCard label="Pageviews Today" value={formatCount(stats.pageviewsToday)} />
        <StatCard label="Article Views (7d)" value={formatCount(stats.articleViews7d)} />
      </div>

      {!compact && (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <AnalyticsChart data={stats.dailyPageviews} />
          <AdminTable>
            <thead>
              <tr>
                <Th>Top Pages (7d)</Th>
                <Th>Views</Th>
              </tr>
            </thead>
            <tbody>
              {stats.topPages.length ? (
                stats.topPages.map((page) => (
                  <tr key={page.path}>
                    <Td className="font-medium text-slate-950">{page.path}</Td>
                    <Td>{formatCount(page.views)}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={2}>No pageview data yet. Browse the site to populate PostHog.</Td>
                </tr>
              )}
            </tbody>
          </AdminTable>
        </div>
      )}

      {!compact && (
        <AdminTable>
          <thead>
            <tr>
              <Th>Tracked Events (7d)</Th>
              <Th>Count</Th>
            </tr>
          </thead>
          <tbody>
            {stats.recentEvents.length ? (
              stats.recentEvents.map((item) => (
                <tr key={item.event}>
                  <Td>{item.event}</Td>
                  <Td>{formatCount(item.count)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={2}>No custom events recorded yet.</Td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      )}
    </div>
  )
}
