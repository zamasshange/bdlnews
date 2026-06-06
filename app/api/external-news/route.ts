import { NextResponse } from 'next/server'
import { fetchExternalNews, type ExternalNewsProvider } from '@/lib/external-news'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const provider = (url.searchParams.get('provider') ?? 'newsdata') as ExternalNewsProvider | 'all'
  const query = url.searchParams.get('q') ?? undefined

  try {
    const articles = await fetchExternalNews({ provider, query })
    return NextResponse.json({ articles })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch external news' },
      { status: 502 },
    )
  }
}
