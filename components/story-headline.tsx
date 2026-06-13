import { headlineLimits, shortHeadline } from '@/lib/headlines'
import { cn } from '@/lib/utils'

type StoryHeadlineProps = {
  title: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  lines?: 1 | 2 | 3
  maxLength?: number
  limit?: keyof typeof headlineLimits
}

export function StoryHeadline({
  title,
  as: Tag = 'h3',
  className,
  lines = 2,
  maxLength,
  limit,
}: StoryHeadlineProps) {
  const cap = maxLength ?? (limit ? headlineLimits[limit] : undefined)
  const text = cap ? shortHeadline(title, cap) : title
  const clamp =
    lines === 1 ? 'line-clamp-1' : lines === 3 ? 'line-clamp-3' : 'line-clamp-2'

  return <Tag className={cn(clamp, 'text-balance', className)}>{text}</Tag>
}
