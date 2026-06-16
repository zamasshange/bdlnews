import Link from 'next/link'
import { BarChart3, ExternalLink, FileText, ImageIcon, LayoutDashboard, MessageSquare, Radio, Settings, Tags, UserPen, Users } from 'lucide-react'
import { AdminNavLink } from '@/components/admin/admin-nav-link'
import { Logo } from '@/components/logo'

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
]

export function AdminShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode
  userName: string
  role: string
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-2xl bg-slate-100 p-2 shadow-inner">
              <Logo className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-primary">BDL News</p>
              <h1 className="mt-1 text-2xl font-semibold">Admin Desk</h1>
            </div>
          </div>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => (
            <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
          >
            <ExternalLink className="size-4" />
            View live site
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 overflow-x-auto lg:hidden">
            {nav.slice(0, 6).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md p-2 text-slate-600 hover:bg-slate-100">
                <item.icon className="size-4" />
              </Link>
            ))}
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
