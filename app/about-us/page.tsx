import Link from 'next/link'
import { ArrowRight, Globe, Sparkles, ShieldCheck, Users } from 'lucide-react'
import { JsonLd } from '@/components/seo/json-ld'
import { SiteShell } from '@/components/site-shell'
import { breadcrumbJsonLd, buildPageMetadata, founderJsonLd, organizationJsonLd } from '@/lib/seo'
export const metadata = buildPageMetadata({
  title: 'About BDL News — Independent South African Digital News Platform',
  description:
    'BDL News is an independent digital news platform founded by Zama Shange. Breaking news, South African news, African news, world news, business, technology, sports, entertainment, and current affairs.',
  path: '/about-us',
  keywords: [
    'About BDL News',
    'Zama Shange Founder',
    'Burdolar Media',
    'BDL News South Africa',
    'BDL News Africa',
    'Independent News',
  ],
})

export default function AboutPage() {
  return (
    <SiteShell showTicker>
      <JsonLd
        data={[
          organizationJsonLd(),
          founderJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'About Us', path: '/about-us' },
          ]),
        ]}
      />
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_0.4fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary tracking-[0.32em]">About BDL News</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Africa’s AI-powered newsroom for stories that matter.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              BDL News is an independent digital news platform founded by Zama Shange. The platform delivers breaking news, South African news, African news, world news, business, technology, sports, entertainment, and current affairs coverage.
            </p>
          </div>
          <div className="space-y-4 rounded-3xl border border-border bg-card p-8">
            <p className="text-xs font-black uppercase text-primary">Mission</p>
            <p className="text-base text-foreground">To make news easier to understand, more transparent, and more useful for everyday people.</p>
            <div className="h-px bg-border" />
            <p className="text-xs font-black uppercase text-primary">Vision</p>
            <p className="text-base text-foreground">To become Africa's most innovative AI-powered media platform.</p>
            <div className="h-px bg-border" />
            <p className="text-xs font-black uppercase text-primary">Values</p>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>Truth · Innovation · Transparency · Community · Independence · Technology</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12">
        <div className="jox-container grid gap-10 lg:grid-cols-[0.5fr_0.5fr]">
          <div>
            <p className="text-xs font-black uppercase text-primary">Founder</p>
            <h2 className="mt-3 text-4xl font-semibold text-foreground">Zama Shange</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Entrepreneur, developer, designer and media innovator. Zama founded BDL Corp and BDL News to create a newsroom that blends editorial credibility with technology-led storytelling for African audiences.
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-border bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <Globe className="size-6 text-primary" />
              <div>
                <p className="text-xs font-black uppercase text-primary">Technology</p>
                <p className="mt-2 text-sm text-muted-foreground">We use AI to help journalists write with speed, accuracy, and editorial context without replacing their judgment.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck className="size-6 text-primary" />
              <div>
                <p className="text-xs font-black uppercase text-primary">Editorial standards</p>
                <p className="mt-2 text-sm text-muted-foreground">Stories are grounded in sourcing, transparency, and context. Our newsroom is built around accountability and fair coverage.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Users className="size-6 text-primary" />
              <div>
                <p className="text-xs font-black uppercase text-primary">Community</p>
                <p className="mt-2 text-sm text-muted-foreground">Reader feedback, news tips, and local perspectives shape our reporting across the continent.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Sparkles className="size-6 text-primary" />
              <div>
                <p className="text-xs font-black uppercase text-primary">Future-focused leadership</p>
                <p className="mt-2 text-sm text-muted-foreground">BDL News aims to be the first newsroom in Africa built to support the next generation of informed citizens and creators.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="jox-container py-12">
        <div className="mb-10 grid gap-10 lg:grid-cols-[0.5fr_0.5fr]">
          <div>
            <p className="text-xs font-black uppercase text-primary">Company timeline</p>
            <div className="mt-6 space-y-6 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">2024</p>
                <p>BDL Corp is founded to bring media, tech, and design together for African stories.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">2025</p>
                <p>BDL News launches as a digital newsroom with live updates and editorial curation.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">2026</p>
                <p>AI features are introduced across article creation and reader experience, making stories easier to understand.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-primary">Newsroom principles</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Clarity over clicks: every story should explain, not just report.</li>
              <li>AI as a newsroom partner: assist journalists and readers, not replace them.</li>
              <li>Source confidence: every claim is tied to verifiable context.</li>
              <li>Audience-first: make complex stories understandable and useful.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12">
        <div className="jox-container grid gap-12 lg:grid-cols-[0.45fr_0.55fr]">
          <div>
            <p className="text-xs font-black uppercase text-primary">Editorial standards</p>
            <h2 className="mt-3 text-4xl font-semibold text-foreground">How BDL News covers the world</h2>
          </div>
          <div className="space-y-6 text-sm leading-7 text-muted-foreground">
            <p>We verify sources, label editorial perspective clearly, surface related context, and avoid sensationalism. Every article is designed to be transparent about what is known, what is still developing, and why it matters.</p>
            <p>Our AI assistant Sonke is built to help readers get the story quickly while preserving the writer’s voice and the newsroom’s standards. That means readers can ask questions, get summaries, and explore related topics without losing the original reporting.</p>
            <p>BDL News believes in independence, innovation, and community. We aim to keep journalism relevant for a new generation of readers while protecting the integrity of facts and context.</p>
          </div>
        </div>
      </section>

      <section className="jox-container py-12">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-primary">Ready to explore</p>
              <h2 className="mt-2 text-3xl font-semibold text-foreground">See how AI and journalism meet at BDL News.</h2>
            </div>
            <Link href="/news" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase text-primary-foreground transition hover:bg-primary/90">
              Visit the news hub
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {['AI newsroom workflow', 'Verified editorial context', 'Interactive reader tools'].map((item) => (
              <div key={item} className="rounded-3xl border border-border p-5">
                <p className="text-sm font-semibold text-foreground">{item}</p>
                <p className="mt-3 text-sm text-muted-foreground">Designed to keep readers informed, engaged, and confident in every story they read.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
