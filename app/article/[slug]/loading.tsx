import { SiteShell } from '@/components/site-shell'

export default function ArticleLoading() {
  return (
    <SiteShell showTicker>
      <div className="jox-container animate-pulse py-10">
        <div className="mb-8 h-4 w-28 rounded bg-muted" />
        <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr]">
          <div className="space-y-4">
            <div className="h-6 w-24 rounded bg-primary/20" />
            <div className="h-16 w-full max-w-4xl rounded bg-muted" />
            <div className="h-16 w-full max-w-3xl rounded bg-muted" />
            <div className="h-24 w-full max-w-2xl rounded bg-muted" />
          </div>
          <div className="h-40 rounded-3xl border border-border bg-card" />
        </div>
        <div className="mt-10 aspect-[16/10] rounded-[2rem] bg-muted" />
        <div className="mt-10 grid gap-4 lg:grid-cols-[0.22fr_0.78fr]">
          <div className="h-56 rounded-3xl bg-card" />
          <div className="space-y-4">
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-5/6 rounded bg-muted" />
            <div className="h-5 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
