import { cn } from '@/lib/utils'

export function Logo({
  className,
}: {
  className?: string
  variant?: 'onLight' | 'onDark'
}) {
  return (
    <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E25A2B] text-white shadow-sm shadow-black/10 md:h-14 md:w-14', className)}>
      <svg viewBox="0 0 120 120" className="h-full w-full p-2" aria-hidden="true">
        <rect width="120" height="120" rx="24" fill="#E25A2B" />
        <path d="M34 24 68 60 34 96 56 96 90 60 56 24Z" fill="#111" />
        <path d="M86 24 52 60 86 96 64 96 30 60 64 24Z" fill="#111" />
      </svg>
    </span>
  )
}
