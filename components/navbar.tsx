'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Search, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { SearchOverlay } from '@/components/search-overlay'
import { Button } from '@/components/ui/button'
import { NAV_LINKS } from '@/lib/data'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="jox-container">
          <div
            className={cn(
              'flex items-center justify-between gap-4 border-b border-border transition-all duration-300',
              scrolled ? 'py-3' : 'py-5',
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="border border-border bg-background text-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            <Link href="/" aria-label="BDL News home" className="shrink-0">
              <Logo className={cn(scrolled ? 'h-11 md:h-14' : 'h-14 md:h-18')} />
            </Link>

            <div className="flex items-center gap-2">
              <Button
              variant="ghost"
              size="icon"
                className="border border-border bg-background text-foreground hover:bg-muted"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-5" />
              </Button>
              <Link
                href="#subscribe"
                className="hidden bg-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground transition hover:bg-foreground sm:inline-flex"
              >
                Subscribe
              </Link>
            </div>
          </div>

          <nav className="no-scrollbar hidden items-center justify-between gap-1 overflow-x-auto py-3 lg:flex">
            {NAV_LINKS.map((label) => {
              const href =
                label === 'Home'
                  ? '/'
                  : `/category/${label.toLowerCase().replace(/\s+/g, '-')}`
              const active = pathname === href
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'relative px-3 py-1 text-[12px] font-black uppercase tracking-wide text-muted-foreground transition hover:text-primary',
                    active && 'text-primary',
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-3 h-0.5 bg-primary"
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-80 max-w-[86vw] border-r border-border bg-background p-5"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo className="h-12" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="border border-border"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <nav className="grid gap-1">
                {NAV_LINKS.map((label) => {
                  const href =
                    label === 'Home'
                      ? '/'
                      : `/category/${label.toLowerCase().replace(/\s+/g, '-')}`
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="border-b border-border py-4 font-heading text-3xl leading-none text-foreground transition hover:text-primary"
                    >
                      {label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
