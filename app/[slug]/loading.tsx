import { SiteShell } from '@/components/site-shell'

export default function CategoryLoading() {
  return (
    <SiteShell showTicker>
      <div className="jox-container animate-pulse py-10">
        <div className="mb-8 h-4 w-28 rounded bg-muted" />
        <div className="mb-10 space-y-4">
          <div className="h-6 w-24 rounded bg-primary/20" />
          <div className="h-14 w-full max-w-3xl rounded bg-muted" />
          <div className="h-20 w-full max-w-2xl rounded bg-muted" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr]">
          <div className="aspect-[1.35] rounded-[2rem] bg-muted" />
          <div className="space-y-4">
            <div className="h-5 w-32 rounded bg-primary/20" />
            <div className="h-12 w-full rounded bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
