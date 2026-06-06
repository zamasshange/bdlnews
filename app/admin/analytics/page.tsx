import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, StatCard, Td, Th } from '@/components/admin/ui'
import { getDashboardStats } from '@/lib/admin/data'
import { formatCount } from '@/lib/data'

export default async function AnalyticsPage() {
  const stats = await getDashboardStats()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Analytics" description="Real-time editorial intelligence across views, readers, devices, sources, and locations." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Views" value={formatCount(stats.totalViews)} />
        <StatCard label="Views Today" value={formatCount(stats.todayViews)} />
        <StatCard label="Monthly Views" value={formatCount(stats.totalViews)} />
        <StatCard label="Active Readers" value={stats.activeReaders} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <AnalyticsChart />
        <AdminTable>
          <thead><tr><Th>Metric</Th><Th>Current Signal</Th></tr></thead>
          <tbody>
            <tr><Td>Most Viewed Articles</Td><Td>Populated from article_views</Td></tr>
            <tr><Td>Trending Articles</Td><Td>Last 24h velocity</Td></tr>
            <tr><Td>Reading Time</Td><Td>Tracked per view event</Td></tr>
            <tr><Td>Traffic Sources</Td><Td>Stored from document.referrer</Td></tr>
            <tr><Td>Device Types</Td><Td>Desktop, tablet, mobile</Td></tr>
            <tr><Td>Countries / Cities</Td><Td>Stored with view event metadata</Td></tr>
          </tbody>
        </AdminTable>
      </div>
    </ProtectedAdminPage>
  )
}
