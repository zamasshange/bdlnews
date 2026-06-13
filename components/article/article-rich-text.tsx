import { TwitterEmbed, TwitterFallbackLink } from '@/components/embeds/twitter-embed'
import { buildRichSegments, buildRichSegmentsForBlocks, isTwitterStatusUrl, type RichSegment } from '@/lib/social-embeds'
import { cn } from '@/lib/utils'

function renderSegments(segments: RichSegment[], className?: string, keyPrefix = 'segment') {
  if (segments.length === 1 && segments[0].kind === 'text') {
    return (
      <p className={className} key={`${keyPrefix}-text`}>
        {segments[0].value.trim()}
      </p>
    )
  }

  return (
    <div className="space-y-6" key={`${keyPrefix}-group`}>
      {segments.map((segment, index) => {
        if (segment.kind === 'twitter') {
          return <TwitterEmbed key={`${keyPrefix}-twitter-${index}`} html={segment.html} />
        }

        if (isTwitterStatusUrl(segment.value)) {
          return <TwitterFallbackLink key={`${keyPrefix}-fallback-${index}`} url={segment.value.trim()} />
        }

        return (
          <p key={`${keyPrefix}-text-${index}`} className={className}>
            {segment.value.trim()}
          </p>
        )
      })}
    </div>
  )
}

export async function createRichTextRenderer(values: string[]) {
  const parse = await buildRichSegmentsForBlocks(values)

  return async function renderRichText(text: string, keyPrefix: string, className?: string) {
    const segments = await parse(text)
    if (!segments.length) return null
    return renderSegments(segments, className, keyPrefix)
  }
}

export async function ArticleRichText({
  text,
  className,
  keyPrefix = 'rich',
}: {
  text: string
  className?: string
  keyPrefix?: string
}) {
  const segments = await buildRichSegments(text)
  if (!segments.length) return null
  return renderSegments(segments, className, keyPrefix)
}

export function articleParagraphClassName(isWireStory: boolean) {
  return cn(isWireStory && 'font-serif text-[1.05rem] leading-9 text-foreground/95')
}
