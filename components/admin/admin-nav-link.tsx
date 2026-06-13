'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: LucideIcon
}) {
  const pathname = usePathname()
  const active = href === '/admin' ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
        active
          ? 'bg-slate-950 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      )}
    >
      <Icon className={cn('size-4', active && 'text-primary')} />
      {label}
    </Link>
  )
}
