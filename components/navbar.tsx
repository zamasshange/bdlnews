'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Search, Sparkles, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { SearchOverlay } from '@/components/search-overlay'
import { Button } from '@/components/ui/button'
import { NAV_LINKS } from '@/lib/data'
import { categoryPathFromName } from '@/lib/category-paths'
import { cn } from '@/lib/utils'

function editionDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

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
      <header className="sticky top-0 z-50 bg-brand-navy text-brand-navy-foreground">
        <div className="jox-container border-b border-white/10 py-2.5">
          <div className="flex items-center justify-between text-xs text-white/70">
            <p>{editionDate()}</p>
            <p className="hidden sm:block">Africa&apos;s AI Newsroom • Live Wire</p>
          </div>
        </div>

        <div className="jox-container">
          <div className="flex items-center justify-between gap-4 py-5 md:py-6">
            <Button
              variant="ghost"
              size="icon"
              className="border border-white/15 text-white hover:bg-white/10 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            <Link href="/" aria-label="BDL News home" className="shrink-0">
              <Logo className="h-10 brightness-0 invert md:h-12" />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.slice(1, 6).map((label) => (
                <Link
                  key={label}
                  href={categoryPathFromName(label)}
                  className="px-2 text-sm text-white/75 transition hover:text-white"
                >
                  {label}
                  <span className="ml-2 text-white/35">•</span>
                </Link>
              ))}
              <Link href="/contact-us" className="px-2 text-sm text-white/75 transition hover:text-white">
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="border border-white/15 text-white hover:bg-white/10"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-5" />
              </Button>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('sonke:ask', { detail: { message: 'What are the biggest stories right now?' } }),
                  )
                }
                className="hidden items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
              >
                <Sparkles className="size-4" />
                Ask Sonke
              </button>
              <Link
                href="#subscribe"
                className="hidden rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-brand-navy transition hover:bg-white/90 sm:inline-flex"
              >
                Subscribe
              </Link>
            </div>
          </div>

          <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto border-t border-white/10 py-3 lg:flex">
            {NAV_LINKS.map((label) => {
              const href = label === 'Home' ? '/' : categoryPathFromName(label)
              const active = pathname === href
              const isSignal = label === 'AI News'
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'relative whitespace-nowrap px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                    isSignal ? 'text-primary' : 'text-white/70 hover:text-white',
                    active && 'text-white',
                  )}
                >
                  {isSignal ? 'BDL Signal' : label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2 -bottom-3 h-0.5 bg-primary"
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
              className="absolute inset-0 bg-brand-navy/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-80 max-w-[86vw] bg-brand-navy p-5 text-white"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo className="h-10 brightness-0 invert" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="border border-white/15 text-white"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <nav className="grid gap-1">
                {NAV_LINKS.map((label) => {
                  const href = label === 'Home' ? '/' : categoryPathFromName(label)
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="border-b border-white/10 py-4 text-2xl font-semibold text-white transition hover:text-primary"
                    >
                      {label === 'AI News' ? 'BDL Signal' : label}
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
