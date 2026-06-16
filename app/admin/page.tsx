import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  DashboardHero,
  DashboardPublishedTable,
  DashboardQuickActions,
} from '@/components/admin/dashboard-panels'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { getDashboardOverviewLight } from '@/lib/admin/data'

export default async function AdminDashboardPage() {
  const overview = await getDashboardOverviewLight()

  return (
    <ProtectedAdminPage>
      <div className="space-y-8">
        <DashboardHero stats={overview.stats} wireCount={overview.wireCount} />
        <DashboardQuickActions />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Publish</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your live stories</h2>
              <p className="mt-2 text-sm text-slate-500">Write a story and hit publish — it goes straight to the site.</p>
            </div>
            <Link
              href="/admin/articles/create"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="size-4" />
              Publish new article
            </Link>
          </div>
          <DashboardPublishedTable articles={overview.publishedArticles} />
        </section>
      </div>
    </ProtectedAdminPage>
  )
}
