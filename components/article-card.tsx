'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { type Article, timeAgo } from '@/lib/data'
import { cn } from '@/lib/utils'

export function ArticleCard({
  article,
  size = 'md',
}: {
  article: Article
  size?: 'sm' | 'md' | 'lg'
}) {
  const Wrapper = article.externalUrl ? 'a' : Link
  const wrapperProps = article.externalUrl
    ? { href: article.externalUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { href: `/article/${article.slug}` }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Wrapper
        className="story-link group block border-t border-border pt-4"
        {...wrapperProps}
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
        </div>
        <div className="pt-4">
          <h3
            className={cn(
              'font-medium leading-tight text-foreground transition group-hover:text-primary',
              size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl',
            )}
          >
            {article.title}
          </h3>
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {timeAgo(article.publishedAt)}
          </p>
        </div>
      </Wrapper>
    </motion.article>
  )
}
