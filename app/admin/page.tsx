import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, StatCard, Td, Th } from '@/components/admin/ui'
import { Logo } from '@/components/logo'
import { getAdminCollections, getDashboardStats, getViewsByDay } from '@/lib/admin/data'
import { formatCount } from '@/lib/data'

export default async function AdminDashboardPage() {
  const [stats, collections, chartData] = await Promise.all([getDashboardStats(), getAdminCollections(), getViewsByDay()])

  return (
    <ProtectedAdminPage>
      <div className="mb-6 grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">BDL Newsroom</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Publishing status, audience pulse, and editorial momentum for a modern newsroom.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-32 items-center justify-center rounded-3xl bg-slate-100 p-3 shadow-inner">
            <Logo className="h-full w-full object-contain" />
          </div>
          <div className="hidden flex-col text-right md:flex">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">BDL</p>
            <p className="text-sm text-slate-500">Editorial dashboard</p>
          </div>
          <a
            href="/admin/articles/create"
            className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-primary"
          >
            New article
          </a>
        </div>
      </div>
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
