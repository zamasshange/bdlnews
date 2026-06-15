import type { Metadata } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AiAssistant } from '@/components/ai-assistant'
import { PostHogProvider } from '@/components/providers/posthog-provider'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata, founderJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import { coreSearchKeywords } from '@/lib/seo-keywords'
import { siteConfig } from '@/lib/site'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  display: 'swap',
})

const rootSeo = buildPageMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: '/',
  keywords: [...coreSearchKeywords],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...rootSeo,
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  category: 'news',
  icons: {
    icon: [
      { url: '/bdl-icon.svg', type: 'image/svg+xml' },
      { url: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/icon-light-32x32.png',
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  themeColor: '#0c1029',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${interTight.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(), founderJsonLd()]} />
        <PostHogProvider>
          <ThemeProvider>
            {children}
            <AiAssistant />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
