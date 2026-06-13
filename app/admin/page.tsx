import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { PostHogAnalyticsPanel } from '@/components/admin/posthog-analytics-panel'
import {
  DashboardHero,
  DashboardPublishedTable,
  DashboardQuickActions,
  DashboardSidePanels,
  DashboardStatsGrid,
} from '@/components/admin/dashboard-panels'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminTable, Td, Th } from '@/components/admin/ui'
import { getDashboardOverview, getViewsByDay } from '@/lib/admin/data'
import { formatCount } from '@/lib/data'

export default async function AdminDashboardPage() {
  const [overview, chartData] = await Promise.all([getDashboardOverview(), getViewsByDay()])

  return (
    <ProtectedAdminPage>
      <div className="space-y-8">
        <DashboardHero stats={overview.stats} wireCount={overview.wireCount} />
        <DashboardQuickActions />
        <DashboardStatsGrid stats={overview.stats} editorial={overview.editorial} />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <PostHogAnalyticsPanel compact />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Site output</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Published stories on BDL News</h2>
            </div>
            <DashboardPublishedTable articles={overview.publishedArticles} />
          </div>

          <DashboardSidePanels
            recentDrafts={overview.recentDrafts}
            pendingComments={overview.pendingComments}
            liveUpdates={overview.liveUpdates}
            topArticles={overview.editorial.topArticles}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Audience</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">7-day article views</h2>
            </div>
            <AnalyticsChart data={chartData} />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Traffic mix</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Where readers come from</h2>
            </div>
            <AdminTable>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th>Views (30d)</Th>
                </tr>
              </thead>
              <tbody>
                {overview.editorial.topSources.length ? (
                  overview.editorial.topSources.map((row) => (
                    <tr key={row.source}>
                      <Td className="font-medium text-slate-950">{row.source}</Td>
                      <Td>{formatCount(row.views)}</Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={2}>Referrer data will appear as article views are recorded.</Td>
                  </tr>
                )}
              </tbody>
            </AdminTable>

            <AdminTable>
              <thead>
                <tr>
                  <Th>Device</Th>
                  <Th>Views (30d)</Th>
                </tr>
              </thead>
              <tbody>
                {overview.editorial.devices.length ? (
                  overview.editorial.devices.map((row) => (
                    <tr key={row.device}>
                      <Td className="capitalize">{row.device}</Td>
                      <Td>{formatCount(row.views)}</Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={2}>Device breakdown will populate from tracked views.</Td>
                  </tr>
                )}
              </tbody>
            </AdminTable>
          </div>
        </section>
      </div>
    </ProtectedAdminPage>
  )
}
