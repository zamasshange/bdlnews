export type Category =
  | 'World'
  | 'Politics'
  | 'Business'
  | 'Technology'
  | 'Sports'
  | 'Entertainment'
  | 'Africa'
  | 'Opinion'
  | 'AI News'
  | 'Science'
  | 'Health'

export type Status = 'LIVE' | 'UPDATED' | 'BREAKING'

export interface AuthorProfile {
  id: string
  name: string
  role: string
  expertise: string[]
  bio: string
  profileImage: string
  socialLinks: { x?: string; linkedin?: string; website?: string }
  articles: number
  views: number
  comments: number
}

export interface PodcastEpisode {
  id: string
  title: string
  description: string
  host: string
  duration: string
  publishedAt: string
  category: string
  image: string
  notes: string
  audioUrl: string
}

export interface SiteLink {
  label: string
  href: string
}

export interface Article {
  id?: string
  slug: string
  title: string
  dek: string
  content?: string
  gallery?: string[]
  imageCredit?: string
  category: Category
  categorySlug?: string
  image: string
  author: string
  authorId?: string
  authorRole: string
  authorBio?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  readingTime: number
  publishedAt: string
  updatedAt?: string
  region: string
  readers: number
  comments?: number
  shares?: number
  engagement: number
  sentiment: 'positive' | 'neutral' | 'controversial'
  trendDelta: number
  externalUrl?: string
}

export const NAV_LINKS = [
  'Home',
  'World',
  'Politics',
  'Business',
  'Technology',
  'Sports',
  'Entertainment',
  'Africa',
  'Opinion',
  'AI News',
] as const

export const SITE_LINKS: SiteLink[] = [
  { label: 'About Us', href: '/about-us' },
  { label: 'News', href: '/news' },
  { label: 'Authors', href: '/authors' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Contact Us', href: '/contact-us' },
]

export const sampleAuthors: AuthorProfile[] = [
  {
    id: 'zama-shange',
    name: 'Zama Shange',
    role: 'Founder & Editor-in-Chief',
    expertise: ['Technology', 'Media', 'Product Design', 'African Entrepreneurship'],
    bio: 'Zama leads BDL News with a vision for AI-powered storytelling, digital product innovation, and entrepreneurial journalism across Africa.',
    profileImage: '/images/authors/zama-shange.jpg',
    socialLinks: {
      x: 'https://x.com/zamashange',
      linkedin: 'https://www.linkedin.com/in/zama-shange',
      website: 'https://bdlcorp.africa',
    },
    articles: 128,
    views: 860000,
    comments: 4200,
  },
  {
    id: 'amara-okonkwo',
    name: 'Amara Okonkwo',
    role: 'Global Affairs Correspondent',
    expertise: ['Geopolitics', 'Climate Policy', 'African Diplomacy'],
    bio: 'Amara covers international affairs with deep context, making complex treaties and global summits easy to understand.',
    profileImage: '/images/authors/amara-okonkwo.jpg',
    socialLinks: {
      x: 'https://x.com/amaraokonkwo',
      linkedin: 'https://www.linkedin.com/in/amaraokonkwo',
    },
    articles: 84,
    views: 520000,
    comments: 1800,
  },
  {
    id: 'kwame-mensah',
    name: 'Kwame Mensah',
    role: 'Africa Bureau Chief',
    expertise: ['Infrastructure', 'Development', 'Trade'],
    bio: 'Kwame brings stories from across Africa, focusing on innovation, economic change, and the people shaping regional growth.',
    profileImage: '/images/authors/kwame-mensah.jpg',
    socialLinks: {
      x: 'https://x.com/kwamemensah',
      linkedin: 'https://www.linkedin.com/in/kwamemensah',
    },
    articles: 97,
    views: 610000,
    comments: 2350,
  },
]

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: 'bdl-conversations-001',
    title: 'AI, Africa and the Future of Trusted Media',
    description: 'A wide-ranging conversation about how AI is reshaping journalism, entrepreneurship, and audience trust across Africa.',
    host: 'Zama Shange',
    duration: '42:11',
    publishedAt: '2026-05-27',
    category: 'Technology',
    image: '/images/podcast/episode-1.jpg',
    notes: 'Discussing the role of AI in reporting, content personalization, and public trust for emerging markets.',
    audioUrl: 'https://example.com/podcast/episode-1.mp3',
  },
  {
    id: 'bdl-conversations-002',
    title: 'Building a Modern Newsroom for Africa',
    description: 'Founders and newsroom leaders share how they use technology, editorial standards, and community feedback to build better local journalism.',
    host: 'Zama Shange',
    duration: '38:25',
    publishedAt: '2026-06-02',
    category: 'Media',
    image: '/images/podcast/episode-2.jpg',
    notes: 'A closer look at newsroom structure, editorial standards, and audience-first storytelling.',
    audioUrl: 'https://example.com/podcast/episode-2.mp3',
  },
]

export const articles: Article[] = [
  {
    slug: 'global-climate-accord-2026',
    title: '63 Nations Sign Landmark Climate Accord to Triple Clean Energy by 2032',
    dek: 'The agreement, reached after marathon negotiations in Geneva, sets the most aggressive emissions targets in history and unlocks a $400B transition fund.',
    category: 'World',
    image: '/images/hero-summit.png',
    author: 'Amara Okonkwo',
    authorRole: 'Global Affairs Correspondent',
    readingTime: 7,
    publishedAt: '2026-06-05T08:12:00Z',
    region: 'Switzerland',
    readers: 184200,
    engagement: 94,
    sentiment: 'neutral',
    trendDelta: 38,
  },
  {
    slug: 'neural-chip-breakthrough',
    title: 'New Neural Chip Runs Frontier AI Models on a Single Watt of Power',
    dek: 'Researchers unveil a photonic processor that could cut data-center energy use by 90%, reshaping the economics of artificial intelligence.',
    category: 'Technology',
    image: '/images/tech-chip.png',
    author: 'Daniel Reyes',
    authorRole: 'Technology Editor',
    readingTime: 6,
    publishedAt: '2026-06-05T06:40:00Z',
    region: 'United States',
    readers: 142800,
    engagement: 88,
    sentiment: 'positive',
    trendDelta: 52,
  },
  {
    slug: 'markets-rally-rate-decision',
    title: 'Markets Rally as Central Banks Signal Coordinated Rate Cuts',
    dek: 'Equities posted their best session in two years after policymakers hinted at synchronized easing to support a fragile global recovery.',
    category: 'Business',
    image: '/images/markets.png',
    author: 'Lena Hoffmann',
    authorRole: 'Markets Correspondent',
    readingTime: 5,
    publishedAt: '2026-06-05T05:20:00Z',
    region: 'United Kingdom',
    readers: 98400,
    engagement: 71,
    sentiment: 'positive',
    trendDelta: 24,
  },
  {
    slug: 'continental-rail-network',
    title: 'Pan-African Rail Network Connects Five Capitals for the First Time',
    dek: 'A continent-spanning infrastructure project opens its first high-speed corridor, promising to reshape regional trade and travel.',
    category: 'Africa',
    image: '/images/africa.png',
    author: 'Kwame Mensah',
    authorRole: 'Africa Bureau Chief',
    readingTime: 8,
    publishedAt: '2026-06-04T19:05:00Z',
    region: 'Kenya',
    readers: 76200,
    engagement: 83,
    sentiment: 'positive',
    trendDelta: 41,
  },
  {
    slug: 'private-mission-mars',
    title: 'First Fully Private Crew Begins Six-Month Journey Toward Mars Orbit',
    dek: 'The mission marks a turning point for commercial spaceflight, carrying scientific payloads from twelve nations.',
    category: 'Science',
    image: '/images/space.png',
    author: 'Priya Nair',
    authorRole: 'Science Correspondent',
    readingTime: 9,
    publishedAt: '2026-06-04T16:30:00Z',
    region: 'United States',
    readers: 121000,
    engagement: 90,
    sentiment: 'positive',
    trendDelta: 33,
  },
  {
    slug: 'world-cup-qualifier-upset',
    title: 'Stunning Late Goal Sends Underdogs Through to the Final',
    dek: 'A 94th-minute strike capped one of the most dramatic semifinals in tournament history, sparking celebrations across the nation.',
    category: 'Sports',
    image: '/images/sports.png',
    author: 'Marco Bianchi',
    authorRole: 'Senior Sports Writer',
    readingTime: 4,
    publishedAt: '2026-06-04T22:50:00Z',
    region: 'Brazil',
    readers: 209500,
    engagement: 96,
    sentiment: 'positive',
    trendDelta: 61,
  },
  {
    slug: 'gene-therapy-milestone',
    title: 'Gene Therapy Restores Sight in Largest Clinical Trial to Date',
    dek: 'Early results show durable vision improvements in 8 of 10 patients, raising hopes for treating inherited blindness at scale.',
    category: 'Health',
    image: '/images/health.png',
    author: 'Dr. Sofia Alvarez',
    authorRole: 'Health & Science Editor',
    readingTime: 6,
    publishedAt: '2026-06-04T11:15:00Z',
    region: 'Spain',
    readers: 64300,
    engagement: 79,
    sentiment: 'positive',
    trendDelta: 28,
  },
  {
    slug: 'global-arts-festival',
    title: 'The World’s Largest Arts Festival Goes Carbon-Neutral',
    dek: 'Organizers reinvent a beloved cultural institution with renewable power, reusable sets, and a record international lineup.',
    category: 'Entertainment',
    image: '/images/culture.png',
    author: 'Yuki Tanaka',
    authorRole: 'Culture Correspondent',
    readingTime: 5,
    publishedAt: '2026-06-04T09:40:00Z',
    region: 'Japan',
    readers: 51200,
    engagement: 68,
    sentiment: 'positive',
    trendDelta: 19,
  },
]

export const breakingTicker: string[] = [
  'Climate accord signed by 63 nations in Geneva',
  'Markets post best session in two years',
  'Private crew begins journey toward Mars orbit',
  'Pan-African rail corridor opens to passengers',
  'Neural chip runs frontier AI on a single watt',
  'Late goal sends underdogs to the final',
]

export const trendingTopics = [
  'Climate Accord',
  'AI Chips',
  'Rate Cuts',
  'Mars Mission',
  'Gene Therapy',
  'Pan-African Rail',
  'Elections 2026',
  'Quantum',
]

export interface LiveItem {
  id: string
  time: string
  category: Category
  headline: string
  status: Status
}

export const liveFeed: LiveItem[] = [
  { id: 'l1', time: '09:42', category: 'World', headline: 'Negotiators confirm final signatures on climate transition fund', status: 'BREAKING' },
  { id: 'l2', time: '09:31', category: 'Business', headline: 'Asian markets open sharply higher following rate-cut signals', status: 'LIVE' },
  { id: 'l3', time: '09:18', category: 'Technology', headline: 'Chipmaker shares surge 14% on photonic processor reveal', status: 'UPDATED' },
  { id: 'l4', time: '09:02', category: 'Sports', headline: 'Final lineup confirmed ahead of tomorrow’s championship', status: 'UPDATED' },
  { id: 'l5', time: '08:51', category: 'Science', headline: 'Mission control confirms successful trajectory burn', status: 'LIVE' },
  { id: 'l6', time: '08:37', category: 'Africa', headline: 'First passenger service departs on continental rail line', status: 'UPDATED' },
  { id: 'l7', time: '08:20', category: 'Health', headline: 'Regulators fast-track review of new gene therapy data', status: 'BREAKING' },
]

export interface RegionData {
  id: string
  name: string
  coordinates: [number, number]
  stories: number
  activity: number
  headline: string
}

export const regions: RegionData[] = [
  { id: 'us', name: 'United States', coordinates: [-98, 39], stories: 1240, activity: 92, headline: 'Neural chip breakthrough reshapes AI economics' },
  { id: 'uk', name: 'United Kingdom', coordinates: [-1.5, 52.5], stories: 860, activity: 74, headline: 'Markets rally on coordinated rate-cut signals' },
  { id: 'ch', name: 'Switzerland', coordinates: [8, 46.8], stories: 410, activity: 88, headline: '63 nations sign landmark climate accord' },
  { id: 'ke', name: 'Kenya', coordinates: [38, 0], stories: 320, activity: 81, headline: 'Pan-African rail corridor opens to passengers' },
  { id: 'br', name: 'Brazil', coordinates: [-52, -10], stories: 540, activity: 95, headline: 'Late goal sends underdogs to the final' },
  { id: 'jp', name: 'Japan', coordinates: [138, 37], stories: 480, activity: 66, headline: 'World’s largest arts festival goes carbon-neutral' },
  { id: 'in', name: 'India', coordinates: [79, 22], stories: 720, activity: 84, headline: 'Record renewable capacity added in single quarter' },
  { id: 'za', name: 'South Africa', coordinates: [24, -29], stories: 290, activity: 70, headline: 'New green hydrogen hub announced for the cape' },
]

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}
