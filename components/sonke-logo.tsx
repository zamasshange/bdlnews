import { cn } from '@/lib/utils'

/** Sonke AI mark only — do not use for BDL News site favicon, manifest, or OG images. */
const ORANGE = '#E86528'

type SonkeLogoProps = {
  className?: string
  size?: number
}

export function SonkeLogo({ className, size = 20 }: SonkeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="Sonke AI"
    >
      <g fill={ORANGE}>
        <path d="M16 40V22q0-6 6-6h22l6 28H44L16 40Z" />
        <path d="M78 16H56l-6 28h28l6-22q0-6-6-6Z" />
        <path d="M84 60v18q0 6-6 6H56l-6-28 28 6 6-22Z" />
        <path d="M22 84h22l6-28H22l-6 22q0 6 6 6Z" />
      </g>
    </svg>
  )
}
