'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { type Article } from '@/lib/data'
import { StoryHeadline } from '@/components/story-headline'
import {
  formatPresspointDate,
  PresspointMetaLine,
} from '@/components/presspoint/section-heading'
import { categoryPathFromName } from '@/lib/category-paths'
import { cn } from '@/lib/utils'

export function ArticleCard({
  article,
  size = 'md',
  layout = 'stack',
}: {
  article: Article
  size?: 'sm' | 'md' | 'lg'
  layout?: 'stack' | 'horizontal'
}) {
  if (layout === 'horizontal') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45 }}
      >
        <Link
          href={`/article/${article.slug}`}
          className="story-link group grid grid-cols-[minmax(112px,34%)_1fr] gap-4 border-b border-border py-5 sm:grid-cols-[minmax(128px,140px)_1fr] sm:gap-5"
        >
          <div className="relative aspect-[1.22] overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={article.image || '/placeholder.svg'}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 34vw, 140px"
              unoptimized={article.image?.startsWith('http')}
              className="story-image object-cover object-center"
            />
          </div>
          <div className="min-w-0 self-center">
            <PresspointMetaLine
              category={article.category}
              date={formatPresspointDate(article.publishedAt)}
              categoryHref={categoryPathFromName(article.category)}
            />
            <StoryHeadline
              title={article.title}
              limit="rail"
              lines={3}
              className="mt-2 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary sm:mt-3 sm:text-lg md:text-xl"
            />
          </div>
        </Link>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
    >
      <Link href={`/article/${article.slug}`} className="story-link group block">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-border bg-muted',
            size === 'lg' ? 'aspect-[1.38] sm:aspect-[4/3]' : 'aspect-[1.45]',
          )}
        >
          <Image
            src={article.image || '/placeholder.svg'}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={article.image?.startsWith('http')}
            className="story-image object-cover object-center"
          />
        </div>
        <div className="pt-4">
          <PresspointMetaLine
            category={article.category}
            date={formatPresspointDate(article.publishedAt)}
            categoryHref={categoryPathFromName(article.category)}
          />
          <StoryHeadline
            title={article.title}
            limit="card"
            lines={2}
            className={cn(
              'mt-3 font-semibold leading-snug text-foreground transition group-hover:text-primary',
              size === 'lg' ? 'text-xl sm:text-2xl md:text-3xl' : 'text-lg sm:text-xl md:text-2xl',
            )}
          />
        </div>
      </Link>
    </motion.article>
  )
}
