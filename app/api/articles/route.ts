import { NextResponse } from 'next/server'
import { getPublishedArticles, searchArticles } from '@/lib/news'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const articles = query ? await searchArticles(query) : await getPublishedArticles()
  return NextResponse.json({ articles })
}
