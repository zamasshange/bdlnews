export const BDL_SIGNAL_SLUG = 'ai-news'

export const bdlSignalBranding = {
  title: 'BDL Signal',
  description:
    'AI-powered journalism from BDL News. Discover stories enhanced with intelligent analysis, trend detection, audience signals, and deeper context beyond the headlines.',
  sidebarTitle: 'BDL Signal',
  sidebarDescription:
    'AI-powered story intelligence tracking audience attention, developing trends, source credibility, and editorial importance across the global news cycle.',
  seoKeywords: [
    'BDL Signal',
    'AI-powered journalism',
    'News intelligence',
    'Trend detection',
    'Smart news coverage',
    'BDL News',
  ],
} as const

export function getCategoryDisplay(slug: string, fallbackName: string) {
  if (slug === BDL_SIGNAL_SLUG) {
    return {
      name: bdlSignalBranding.title,
      description: bdlSignalBranding.description,
      sidebarTitle: bdlSignalBranding.sidebarTitle,
      sidebarDescription: bdlSignalBranding.sidebarDescription,
    }
  }

  return {
    name: fallbackName,
    description: `A focused feed of BDL reporting, context, and AI-assisted signals across the latest ${fallbackName.toLowerCase()} stories.`,
    sidebarTitle: 'BDL Signal',
    sidebarDescription: 'stories tracked with live reader interest, source context, and editorial priority.',
  }
}
