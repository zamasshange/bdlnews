import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/logo'
import { NAV_LINKS, articles } from '@/lib/data'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="jox-container py-12">
        <div className="mb-10 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-center lg:justify-between">
          <Logo className="h-14 md:h-20" />
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV_LINKS.slice(1, 7).map((link) => (
              <Link
                key={link}
                href={`/category/${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs font-black uppercase text-muted-foreground transition hover:text-primary"
              >
                {link}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr_0.7fr]">
          <div>
            <h2 className="max-w-md text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              News for people who move fast.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              BDL News keeps the original reporting data, authors, topics, and live
              feed flowing through a sharper editorial experience.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                className="story-link group block"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="180px"
                    className="story-image object-cover"
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid content-start gap-5 text-sm text-muted-foreground">
            <div>
              <p className="mb-2 text-xs font-black uppercase text-primary">Pages</p>
              <div className="grid gap-2">
                {[
                  ['About Us', '/about-us'],
                  ['News', '/news'],
                  ['Authors', '/authors'],
                  ['Podcast', '/podcast'],
                  ['Contact Us', '/contact-us'],
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="transition hover:text-foreground">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase text-primary">Contact Us</p>
              <p>burdolar@gmail.com</p>
              <p>+27736701175</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BDL Corp</p>
          <p>Designed as a fast, AI-led newsroom.</p>
        </div>
      </div>
    </footer>
  )
}

