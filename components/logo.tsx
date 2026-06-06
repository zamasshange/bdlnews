import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({
  className,
}: {
  className?: string
  variant?: 'onLight' | 'onDark'
}) {
  return (
    <Image
      src="/bdl-news-header-logo.png"
      alt="BDL News"
      width={4688}
      height={1563}
      priority
      className={cn('h-12 w-auto object-contain md:h-16', className)}
    />
  )
}
