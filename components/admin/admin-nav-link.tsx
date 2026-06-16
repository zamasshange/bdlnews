'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Settings,
  Tags,
  UserPen,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/articles', label: 'Articles', icon: FileText },
  { href: '/admin/live-news', label: 'Live News', icon: Radio },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/authors', label: 'Authors', icon: UserPen },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const

export function AdminSidebarNav() {
  return (
    <nav className="grid gap-1 p-3">
      {nav.map((item) => (
        <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
      ))}
    </nav>
  )
}

export function AdminMobileNav() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto lg:hidden">
      {nav.slice(0, 6).map((item) => (
        <Link key={item.href} href={item.href} className="rounded-md p-2 text-slate-600 hover:bg-slate-100">
          <item.icon className="size-4" />
        </Link>
      ))}
    </div>
  )
}

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
