import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { PostHogAnalyticsPanel } from '@/components/admin/posthog-analytics-panel'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, StatCard, Td, Th } from '@/components/admin/ui'
import { getDashboardStats, getEditorialAnalytics, getViewsByDay } from '@/lib/admin/data'
import { formatCount } from '@/lib/data'

export default async function AnalyticsPage() {
  const [stats, editorial, chartData, chart30] = await Promise.all([
    getDashboardStats(),
    getEditorialAnalytics(),
    getViewsByDay(7),
    getViewsByDay(30),
  ])

  const views30Total = chart30.reduce((sum, day) => sum + day.views, 0)

  return (
    <ProtectedAdminPage>
      <AdminPageHeader
        title="Analytics"
        description="Live visitor intelligence from PostHog, plus editorial view data from the BDL newsroom."
      />

      <PostHogAnalyticsPanel />

      <div className="mt-10">
        <AdminPageHeader
          title="Editorial Views"
          description="Article view counts stored in the BDL database."
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Views" value={formatCount(stats.totalViews)} accent="primary" />
        <StatCard label="Views Today" value={formatCount(stats.todayViews)} />
        <StatCard label="Views (30d)" value={formatCount(editorial.views30d)} />
        <StatCard label="Approved Comments" value={editorial.approvedComments} accent="success" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Daily article views</h2>
          <AnalyticsChart data={chartData} />
          <p className="mt-3 text-sm text-slate-500">{formatCount(views30Total)} views recorded across the last 30 days.</p>
        </div>

        <AdminTable>
          <thead>
            <tr>
              <Th>Most viewed stories</Th>
              <Th>Views</Th>
            </tr>
          </thead>
          <tbody>
            {editorial.topArticles.length ? (
              editorial.topArticles.map((article) => (
                <tr key={article.slug}>
                  <Td className="font-medium text-slate-950">{article.title}</Td>
                  <Td>{formatCount(article.views)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={2}>No article view ranking yet.</Td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminTable>
          <thead>
            <tr>
              <Th>Traffic sources (30d)</Th>
              <Th>Views</Th>
            </tr>
          </thead>
          <tbody>
            {editorial.topSources.length ? (
              editorial.topSources.map((row) => (
                <tr key={row.source}>
                  <Td>{row.source}</Td>
                  <Td>{formatCount(row.views)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={2}>Referrer data will appear from article view events.</Td>
              </tr>
            )}
          </tbody>
        </AdminTable>

        <AdminTable>
          <thead>
            <tr>
              <Th>Device types (30d)</Th>
              <Th>Views</Th>
            </tr>
          </thead>
          <tbody>
            {editorial.devices.length ? (
              editorial.devices.map((row) => (
                <tr key={row.device}>
                  <Td className="capitalize">{row.device}</Td>
                  <Td>{formatCount(row.views)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={2}>Device data will appear from article view events.</Td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      </div>
    </ProtectedAdminPage>
  )
}
