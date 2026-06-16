import Link from 'next/link'
import {
  ArrowUpRight,
  FilePenLine,
  Globe2,
  MessageSquareWarning,
  Newspaper,
  Plus,
  Radio,
  Sparkles,
} from 'lucide-react'
import type { DashboardOverview } from '@/lib/admin/data'
import { formatCount } from '@/lib/data'
import { AdminTable, StatCard, Td, Th } from '@/components/admin/ui'

const quickActions = [
  { href: '/admin/articles/create', label: 'Publish story', icon: Plus },
  { href: '/admin/live-news', label: 'Live update', icon: Radio },
  { href: '/admin/comments', label: 'Moderate comments', icon: MessageSquareWarning },
  { href: '/admin/media', label: 'Upload media', icon: Sparkles },
]

export function DashboardHero({ stats, wireCount }: { stats: DashboardOverview['stats']; wireCount: number }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-lg">
      <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">BDL Newsroom Command</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Editorial dashboard</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Publish originals, monitor live wire coverage, track audience momentum, and keep the public site fresh from one desk.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/articles/create"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="size-4" />
              New article
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Globe2 className="size-4" />
              View live site
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Published</p>
            <p className="mt-2 text-3xl font-semibold">{stats.publishedArticles + stats.breakingStories}</p>
            <p className="mt-1 text-xs text-slate-400">BDL originals live on site</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Wire cache</p>
            <p className="mt-2 text-3xl font-semibold">{formatCount(wireCount)}</p>
            <p className="mt-1 text-xs text-slate-400">Syndicated stories available</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Views today</p>
            <p className="mt-2 text-3xl font-semibold">{formatCount(stats.todayViews)}</p>
            <p className="mt-1 text-xs text-slate-400">Tracked article reads</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Drafts</p>
            <p className="mt-2 text-3xl font-semibold">{stats.draftArticles + stats.scheduledArticles}</p>
            <p className="mt-1 text-xs text-slate-400">Waiting to publish</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function DashboardQuickActions() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white transition group-hover:bg-primary">
              <action.icon className="size-4" />
            </span>
            <span className="text-sm font-semibold text-slate-950">{action.label}</span>
          </div>
          <ArrowUpRight className="size-4 text-slate-400 transition group-hover:text-primary" />
        </Link>
      ))}
    </section>
  )
}

export function DashboardStatsGrid({
  stats,
  editorial,
}: {
  stats: DashboardOverview['stats']
  editorial: DashboardOverview['editorial']
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Articles" value={stats.totalArticles} />
      <StatCard label="Published Live" value={stats.publishedArticles + stats.breakingStories} accent="success" />
      <StatCard label="Views (30d)" value={formatCount(editorial.views30d)} accent="primary" />
      <StatCard label="Pending Comments" value={editorial.pendingComments} accent={editorial.pendingComments ? 'warning' : 'default'} />
      <StatCard label="Breaking Stories" value={stats.breakingStories} />
      <StatCard label="Authors" value={stats.totalAuthors} />
      <StatCard label="Total Views" value={formatCount(stats.totalViews)} />
      <StatCard label="Views Today" value={formatCount(stats.todayViews)} hint="From article view tracking" />
    </section>
  )
}

export function DashboardPublishedTable({ articles }: { articles: DashboardOverview['publishedArticles'] }) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <Th>Published on site</Th>
          <Th>Category</Th>
          <Th>Status</Th>
          <Th>Updated</Th>
        </tr>
      </thead>
      <tbody>
        {articles.length ? (
          articles.map((article) => (
            <tr key={article.id}>
              <Td>
                <Link href={`/admin/articles/edit/${article.id}`} className="font-semibold text-slate-950 hover:text-primary">
                  {article.headline}
                </Link>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <Link href={`/article/${article.slug}`} target="_blank" className="text-primary hover:underline">
                    View public page
                  </Link>
                </div>
              </Td>
              <Td>{article.category}</Td>
              <Td className="capitalize">{article.status}</Td>
              <Td>{new Date(article.updated_at).toLocaleString()}</Td>
            </tr>
          ))
        ) : (
          <tr>
            <Td colSpan={4}>
              No published BDL stories yet. The homepage is currently led by live wire coverage until you publish.
            </Td>
          </tr>
        )}
      </tbody>
    </AdminTable>
  )
}

export function DashboardSidePanels({
  recentDrafts,
  pendingComments,
  liveUpdates,
  topArticles,
}: {
  recentDrafts: DashboardOverview['recentDrafts']
  pendingComments: DashboardOverview['pendingComments']
  liveUpdates: DashboardOverview['liveUpdates']
  topArticles: DashboardOverview['editorial']['topArticles']
}) {
  return (
    <div className="grid gap-6">
      <Panel title="Top read stories" icon={Newspaper}>
        {topArticles.length ? (
          <ul className="space-y-3">
            {topArticles.map((article) => (
              <li key={article.slug} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <Link href={`/article/${article.slug}`} target="_blank" className="text-sm font-semibold text-slate-950 hover:text-primary">
                    {article.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{formatCount(article.views)} views</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text="View data will appear once readers start opening articles." />
        )}
      </Panel>

      <Panel title="Drafts in progress" icon={FilePenLine}>
        {recentDrafts.length ? (
          <ul className="space-y-3">
            {recentDrafts.map((article) => (
              <li key={article.id}>
                <Link href={`/admin/articles/edit/${article.id}`} className="text-sm font-semibold text-slate-950 hover:text-primary">
                  {article.headline}
                </Link>
                <p className="mt-1 text-xs capitalize text-slate-500">{article.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text="No drafts waiting. Start a new story when you're ready." />
        )}
      </Panel>

      <Panel title="Comments to review" icon={MessageSquareWarning}>
        {pendingComments.length ? (
          <ul className="space-y-3">
            {pendingComments.map((comment) => (
              <li key={comment.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-slate-950">{comment.author_name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{comment.body}</p>
                <Link href="/admin/comments" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                  Open moderation
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text="No comments waiting for approval." />
        )}
      </Panel>

      <Panel title="Latest live wire desk" icon={Radio}>
        {liveUpdates.length ? (
          <ul className="space-y-3">
            {liveUpdates.map((item) => (
              <li key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-slate-950">{item.headline}</p>
                <p className="mt-1 text-xs uppercase text-slate-500">
                  {item.categories?.name ?? 'Live'} • {item.status}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text="No live updates yet. Add one from Live News." />
        )}
      </Panel>
    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Newspaper
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-slate-500">{text}</p>
}
