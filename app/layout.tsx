import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AiAssistant } from '@/components/ai-assistant'
import { PostHogProvider } from '@/components/providers/posthog-provider'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata, founderJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import { siteConfig } from '@/lib/site'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const rootSeo = buildPageMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: '/',
  keywords: ['Breaking News', 'Latest News', 'South African News', 'African News', 'World News'],
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
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport = {
  themeColor: '#ffffff',
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
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
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
