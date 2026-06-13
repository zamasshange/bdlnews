'use client'

import { FormattedParagraph } from '@/components/article/formatted-paragraph'
import { splitParagraphs } from '@/lib/content-segments'
import { cn } from '@/lib/utils'

type ContentBlock = Record<string, unknown> & {
  type?: string
  text?: string
  html?: string
  url?: string
  caption?: string
  alt?: string
  items?: unknown[]
}

function paragraphClassName(isWireStory: boolean) {
  return cn(
    'text-lg leading-8 text-foreground',
    isWireStory && 'font-serif text-[1.05rem] leading-9 text-foreground/95',
  )
}

function renderBlock(block: ContentBlock, index: number, articleTitle: string, isWireStory: boolean) {
  const className = paragraphClassName(isWireStory)

  switch (block.type) {
    case 'heading':
      return (
        <h2 key={index} className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          {String(block.text ?? '')}
        </h2>
      )
    case 'subheading':
      return (
        <h3 key={index} className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
          {String(block.text ?? '')}
        </h3>
      )
    case 'quote':
      return (
        <blockquote
          key={index}
          className="rounded-3xl border-l-4 border-primary bg-muted px-6 py-5 text-xl italic leading-8 text-foreground"
        >
          {String(block.text ?? '')}
        </blockquote>
      )
    case 'pull_quote':
      return (
        <div key={index} className="rounded-3xl border border-border bg-card p-6 text-lg font-semibold text-foreground">
          {String(block.text ?? '')}
        </div>
      )
    case 'image':
      return (
        <figure key={index} className="overflow-hidden rounded-[2rem] bg-muted shadow-sm">
          <img
            src={String(block.url || '/placeholder.jpg')}
            alt={String(block.alt || articleTitle)}
            className="w-full object-cover"
          />
          {block.caption ? (
            <figcaption className="border-t border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              {String(block.caption)}
            </figcaption>
          ) : null}
        </figure>
      )
    case 'video':
      return block.url ? (
        <div key={index} className="overflow-hidden rounded-[2rem] bg-black">
          <iframe
            src={String(block.url)}
            title={String(block.caption || 'Embedded video')}
            className="h-80 w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>
      ) : null
    case 'embed': {
      const embedValue = String(block.html ?? block.url ?? block.text ?? '').trim()
      return <FormattedParagraph key={index} text={embedValue} className={className} />
    }
    case 'custom_html': {
      const html = String(block.html ?? '')
      if (/twitter\.com|x\.com|pic\.twitter\.com|t\.co\//i.test(html)) {
        return <FormattedParagraph key={index} text={html} className={className} />
      }
      return (
        <div
          key={index}
          className="article-body prose rounded-3xl border border-border bg-muted p-6 text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    }
    default:
      return block.text ? (
        <FormattedParagraph key={index} text={String(block.text)} className={className} />
      ) : null
  }
}

export function ArticleBodyContent({
  article,
  contentBlocks,
  isWireStory,
}: {
  article: { title: string; dek?: string; content?: string | null }
  contentBlocks: ContentBlock[] | null
  isWireStory: boolean
}) {
  const paragraphs = splitParagraphs(article.content ?? '')
  const showLead =
    article.dek &&
    !contentBlocks &&
    !paragraphs.some((paragraph) => paragraph.trim() === article.dek?.trim())

  const className = paragraphClassName(isWireStory)

  if (contentBlocks?.length) {
    return (
      <div className="article-body space-y-8">
        {showLead ? (
          <p className="border-l-4 border-primary pl-5 text-xl leading-relaxed text-foreground md:text-2xl">
            {article.dek}
          </p>
        ) : null}
        {contentBlocks.map((block, index) => renderBlock(block, index, article.title, isWireStory))}
      </div>
    )
  }

  if ((article.content ?? '').trim()) {
    return (
      <div className="article-body space-y-8">
        {showLead ? (
          <p className="border-l-4 border-primary pl-5 text-xl leading-relaxed text-foreground md:text-2xl">
            {article.dek}
          </p>
        ) : null}
        {paragraphs.map((paragraph, index) => (
          <FormattedParagraph key={index} text={paragraph} className={className} />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <p className="text-lg font-semibold text-foreground">This story is curated for you.</p>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        Sonke can summarize this headline, explain the context, or help you filter the latest news into what matters most. Tap the assistant at the bottom-right to get the quick version.
      </p>
    </div>
  )
}
