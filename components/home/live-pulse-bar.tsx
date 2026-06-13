import type { Article } from '@/lib/data'

export function StoryBadge({ article }: { article: Article }) {
  const isWire = Boolean(article.externalUrl)

  return (
    <span
      className={
        isWire
          ? 'inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary'
          : 'inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-background'
      }
    >
      {isWire ? (
        <>
          <span className="live-dot size-2 rounded-full bg-primary" />
          Live Wire
        </>
      ) : (
        'BDL Original'
      )}
    </span>
  )
}

export function LivePulseBar({
  mode,
  ownCount,
  wireCount,
  recentOwnCount,
}: {
  mode: 'editorial' | 'wire' | 'mixed'
  ownCount: number
  wireCount: number
  recentOwnCount: number
}) {
  const headline =
    mode === 'wire'
      ? 'Latest headlines from the wire — ranked by freshness'
      : mode === 'mixed'
        ? 'Fresh stories first — new BDL originals jump to the top when you publish'
        : 'Fresh BDL originals leading today’s homepage'

  return (
    <div className="mesh-bg border-b border-border">
      <div className="jox-container flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
            <span className="live-dot size-3 rounded-full bg-primary" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">BDL Pulse</p>
            <p className="mt-2 max-w-2xl text-lg font-semibold leading-snug text-foreground md:text-xl">{headline}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          <span className="border border-border bg-background px-3 py-2">{wireCount} live wire stories</span>
          <span className="border border-border bg-background px-3 py-2">{recentOwnCount} recent originals</span>
          <span className="border border-border bg-background px-3 py-2">{ownCount} published total</span>
        </div>
      </div>
    </div>
  )
}
