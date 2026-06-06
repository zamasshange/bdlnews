'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { type Article, timeAgo } from '@/lib/data'
import { cn } from '@/lib/utils'

export function ArticleCard({
  article,
  size = 'md',
}: {
  article: Article
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Link
        href={`/article/${article.slug}`}
        className="story-link group block border-t border-border pt-4"
      >
        <div className={cn('relative overflow-hidden bg-muted', size === 'lg' ? 'aspect-[1.38]' : 'aspect-[1.45]')}>
          <Image
            src={article.image || '/placeholder.svg'}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={article.image?.startsWith('http')}
            className="story-image object-cover"
          />
          <span className="absolute left-3 top-3 bg-primary px-2.5 py-1 text-[10px] font-black uppercase text-black">
            {article.category}
          </span>
        </div>
        <div className="pt-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
            <span>{article.author}</span>
            <span className="text-primary">*</span>
            <span>{article.readingTime} Min</span>
            <span className="text-primary">*</span>
            <span>{timeAgo(article.publishedAt)}</span>
          </div>
          <h3
            className={cn(
              'font-medium leading-tight text-foreground transition group-hover:text-primary',
              size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl',
            )}
          >
            {article.title}
          </h3>
          {size !== 'sm' && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {article.dek}
            </p>
          )}
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase text-primary">
            Read More <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}
