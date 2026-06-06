import { NextResponse } from 'next/server'
import { getExternalNewsItems, getPublishedArticles, searchArticles } from '@/lib/news'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const source = (searchParams.get('source') ?? 'internal') as 'internal' | 'external' | 'all'

  const internal = source !== 'external' ? (query ? await searchArticles(query) : await getPublishedArticles()) : []
  const external = source !== 'internal' && query ? await getExternalNewsItems(query, 12) : []

  const articles =
    source === 'external' ? external : source === 'all' ? [...internal, ...external] : internal

  return NextResponse.json({ articles })
}
