import Image from 'next/image'
import { cn } from '@/lib/utils'

type SonkeLogoProps = {
  className?: string
  size?: number
}

export function SonkeLogo({ className, size = 20 }: SonkeLogoProps) {
  return (
    <Image
      src="/sonke-logo.png"
      alt="Sonke AI"
      width={size}
      height={size}
      className={cn('rounded-md', className)}
      unoptimized
    />
  )
}
