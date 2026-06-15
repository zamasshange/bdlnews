import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Sonke AI mark only — do not use for BDL News site favicon, manifest, or OG images. */
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
      className={cn('shrink-0 rounded-md', className)}
      unoptimized
    />
  )
}
