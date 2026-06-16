import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { AdminMobileNav, AdminSidebarNav } from '@/components/admin/admin-nav-link'
import { Logo } from '@/components/logo'

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
        <AdminSidebarNav />
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
          <AdminMobileNav />
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
