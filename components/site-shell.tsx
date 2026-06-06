import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { BreakingTicker } from '@/components/breaking-ticker'

export function SiteShell({
  children,
  showTicker = false,
}: {
  children: React.ReactNode
  showTicker?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {showTicker && <BreakingTicker />}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
