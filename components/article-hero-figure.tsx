import Image from 'next/image'
import type { Article } from '@/lib/data'
import { wireHeroCaption } from '@/lib/syndicated-enrich'

export function ArticleHeroFigure({ article }: { article: Article }) {
  const caption = article.externalUrl
    ? wireHeroCaption(article)
    : article.imageCredit
      ? `${article.dek || article.title} (Photo: ${article.imageCredit})`
      : article.dek || article.title

  return (
    <figure className="overflow-hidden border border-border bg-muted">
      <div className="relative aspect-[16/10] sm:aspect-[3/2]">
        <Image
          src={article.image || '/placeholder.jpg'}
          alt={article.title}
          fill
          priority
          unoptimized={article.image?.startsWith('http')}
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
      </div>
      <figcaption className="border-t border-border bg-background px-4 py-4 text-base italic leading-relaxed text-muted-foreground md:px-5 md:py-5 md:text-lg">
        {caption}
      </figcaption>
    </figure>
  )
}
