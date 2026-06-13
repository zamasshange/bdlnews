import type { Article } from '@/lib/data'
import { createRichTextRenderer, articleParagraphClassName } from '@/components/article/article-rich-text'
import { collectTwitterUrlsFromContent, isTwitterStatusUrl } from '@/lib/social-embeds'

type ContentBlock = Record<string, unknown> & {
  type?: string
  text?: string
  html?: string
  url?: string
  caption?: string
  alt?: string
  items?: unknown[]
}

export async function ArticleBodyContent({
  article,
  contentBlocks,
  isWireStory,
}: {
  article: Article
  contentBlocks: ContentBlock[] | null
  isWireStory: boolean
}) {
  const paragraphClass = articleParagraphClassName(isWireStory)
  const renderRichText = await createRichTextRenderer(
    collectTwitterUrlsFromContent(article.content, contentBlocks),
  )

  const paragraphs = (article.content ?? '').split(/\n{2,}/).filter(Boolean)
  const showLead =
    article.dek &&
    !contentBlocks &&
    !paragraphs.some((paragraph) => paragraph.trim() === article.dek?.trim())

  const renderBlock = async (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        return (
          <h2 key={index} className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {block.text}
          </h2>
        )
      case 'subheading':
        return (
          <h3 key={index} className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {block.text}
          </h3>
        )
      case 'quote':
        return (
          <blockquote
            key={index}
            className="rounded-3xl border-l-4 border-primary bg-muted px-6 py-5 text-xl italic leading-8 text-foreground"
          >
            {block.text}
          </blockquote>
        )
      case 'pull_quote':
        return (
          <div key={index} className="rounded-3xl border border-border bg-card p-6 text-lg font-semibold text-foreground">
            {block.text}
          </div>
        )
      case 'image':
        return (
          <figure key={index} className="overflow-hidden rounded-[2rem] bg-muted shadow-sm">
            <img
              src={(block.url as string) || '/placeholder.jpg'}
              alt={(block.alt as string) || article.title}
              className="w-full object-cover"
            />
            {block.caption ? (
              <figcaption className="border-t border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        )
      case 'image_gallery':
        return (
          <div key={index} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(block.items)
              ? block.items.map((src, itemIndex) => (
                  <div key={itemIndex} className="overflow-hidden rounded-3xl bg-muted">
                    <img
                      src={String(src || '/placeholder.jpg')}
                      alt={`${article.title} image ${itemIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))
              : null}
          </div>
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
        if (isTwitterStatusUrl(embedValue) || /twitter\.com|x\.com/i.test(embedValue)) {
          return renderRichText(embedValue, `embed-${index}`, paragraphClass)
        }
        if (embedValue.startsWith('http')) {
          return (
            <div key={index} className="overflow-hidden rounded-[2rem] border border-border bg-muted">
              <iframe src={embedValue} title="Embedded content" className="h-80 w-full" />
            </div>
          )
        }
        return (
          <div
            key={index}
            className="prose rounded-3xl border border-border bg-muted p-6 text-foreground"
            dangerouslySetInnerHTML={{ __html: embedValue }}
          />
        )
      }
      case 'fact_box':
        return (
          <div key={index} className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Fact Box</p>
            <p className="mt-3 text-base text-foreground">{block.text}</p>
          </div>
        )
      case 'timeline':
        return (
          <div key={index} className="space-y-3 rounded-3xl border border-border bg-muted p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Timeline</p>
            {Array.isArray(block.items)
              ? block.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="rounded-2xl bg-background p-4 text-sm text-foreground">
                    {String(item)}
                  </div>
                ))
              : null}
          </div>
        )
      case 'statistics':
        return (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            {Array.isArray(block.items)
              ? block.items.map((stat, statIndex) => {
                  const record = stat as { value?: string; label?: string }
                  return (
                    <div key={statIndex} className="rounded-3xl border border-border bg-card p-5 text-sm text-foreground">
                      <p className="font-black text-2xl">{record.value}</p>
                      <p className="mt-2 text-muted-foreground">{record.label}</p>
                    </div>
                  )
                })
              : null}
          </div>
        )
      case 'ai_summary':
        return (
          <div key={index} className="rounded-3xl border border-primary/40 bg-primary/5 p-6 text-sm leading-7 text-foreground">
            <p className="font-semibold text-foreground">AI Summary</p>
            <p className="mt-3">{block.text}</p>
          </div>
        )
      case 'custom_html': {
        const html = String(block.html ?? '')
        if (/twitter\.com|x\.com/i.test(html)) {
          return renderRichText(html, `custom-html-${index}`, paragraphClass)
        }
        return (
          <div key={index} className="prose rounded-3xl border border-border bg-muted p-6 text-foreground">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )
      }
      default:
        return block.text
          ? renderRichText(String(block.text), `block-${index}`, paragraphClass)
          : null
    }
  }

  if (contentBlocks?.length) {
    const renderedBlocks = await Promise.all(contentBlocks.map((block, index) => renderBlock(block, index)))
    return (
      <>
        {showLead ? (
          <p className="border-l-4 border-primary pl-5 text-xl leading-relaxed text-foreground md:text-2xl">
            {article.dek}
          </p>
        ) : null}
        {renderedBlocks.map((block, index) => (
          <div key={`article-block-${index}`}>{block}</div>
        ))}
      </>
    )
  }

  if ((article.content ?? '').trim()) {
    const renderedParagraphs = await Promise.all(
      paragraphs.map((paragraph, index) =>
        renderRichText(paragraph, `paragraph-${index}`, paragraphClass),
      ),
    )

    return (
      <>
        {showLead ? (
          <p className="border-l-4 border-primary pl-5 text-xl leading-relaxed text-foreground md:text-2xl">
            {article.dek}
          </p>
        ) : null}
        {renderedParagraphs.map((paragraph, index) => (
          <div key={`article-paragraph-${index}`}>{paragraph}</div>
        ))}
      </>
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
