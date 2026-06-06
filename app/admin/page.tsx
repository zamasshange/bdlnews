import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, StatCard, Td, Th } from '@/components/admin/ui'
import { getAdminCollections, getDashboardStats, getViewsByDay } from '@/lib/admin/data'
import { formatCount } from '@/lib/data'

export default async function AdminDashboardPage() {
  const [stats, collections, chartData] = await Promise.all([getDashboardStats(), getAdminCollections(), getViewsByDay()])

  return (
    <ProtectedAdminPage>
      <AdminPageHeader
        title="Newsroom Dashboard"
        description="Publishing status, audience activity, and the latest editorial movement across BDL News."
        actionHref="/admin/articles/create"
        actionLabel="New article"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Articles" value={stats.totalArticles} />
        <StatCard label="Published" value={stats.publishedArticles} />
        <StatCard label="Drafts" value={stats.draftArticles} />
        <StatCard label="Scheduled" value={stats.scheduledArticles} />
        <StatCard label="Breaking News" value={stats.breakingStories} />
        <StatCard label="Authors" value={stats.totalAuthors} />
        <StatCard label="Total Views" value={formatCount(stats.totalViews)} />
        <StatCard label="Today's Views" value={formatCount(stats.todayViews)} hint={`${stats.activeReaders} active readers`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <AnalyticsChart data={chartData} />
        <AdminTable>
          <thead><tr><Th>Latest Published Stories</Th><Th>Status</Th><Th>Updated</Th></tr></thead>
          <tbody>
            {collections.articles.slice(0, 7).map((article: any) => (
              <tr key={article.id}>
                <Td className="font-semibold text-slate-950">{article.headline}</Td>
                <Td>{article.status}</Td>
                <Td>{new Date(article.updated_at).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </ProtectedAdminPage>
  )
}
