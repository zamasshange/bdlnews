import Link from 'next/link'
import { Logo } from '@/components/logo'
import { NewsletterForm } from '@/components/newsletter-form'
import { NAV_LINKS, SITE_LINKS } from '@/lib/data'
import { categoryPathFromName } from '@/lib/category-paths'
import { siteConfig } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy text-brand-navy-foreground">
      <div className="jox-container border-b border-white/10 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h3 className="max-w-xl text-3xl font-semibold leading-tight md:text-4xl">
              Subscribe to our newsletter to stay ahead with{' '}
              <span className="text-white/55">daily headlines.</span>
            </h3>
          </div>
          <NewsletterForm variant="footer" />
        </div>
      </div>

      <div className="jox-container py-12">
        <div className="mb-10 h-px bg-white/10" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <Link href="/" aria-label="BDL News home">
              <Logo className="h-10 brightness-0 invert md:h-12" />
            </Link>
            <p className="max-w-md text-sm leading-7 text-white/65">{siteConfig.description}</p>
            <p className="text-sm text-white/55">Follow us for breaking news and live updates.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-4 text-sm font-semibold text-white">Pages</p>
              <div className="grid gap-2 text-sm text-white/65">
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
                {SITE_LINKS.slice(0, 4).map((link) => (
                  <Link key={link.href} href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold text-white">Categories</p>
              <div className="grid gap-2 text-sm text-white/65">
                {NAV_LINKS.slice(1, 6).map((label) => (
                  <Link
                    key={label}
                    href={categoryPathFromName(label)}
                    className="transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold text-white">Contact us</p>
              <div className="grid gap-2 text-sm text-white/65">
                <p>{siteConfig.name}</p>
                <a href="mailto:burdolar@gmail.com" className="transition hover:text-white">
                  burdolar@gmail.com
                </a>
                <a href="tel:+27736701175" className="transition hover:text-white">
                  +27 73 670 1175
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BDL Corp. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link href="/about-us" className="transition hover:text-white">
              Privacy
            </Link>
            <span>|</span>
            <Link href="/contact-us" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
