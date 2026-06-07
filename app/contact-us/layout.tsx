import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Contact BDL News',
  description:
    'Contact BDL News for story tips, corrections, editorial partnerships, and audience support. Reach the Burdolar Media newsroom founded by Zama Shange.',
  path: '/contact-us',
  keywords: ['Contact BDL News', 'News Tips', 'Burdolar Media', 'BDL News Support'],
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
