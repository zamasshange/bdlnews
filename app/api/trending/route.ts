import { NextResponse } from 'next/server'
import { getTrendingArticles } from '@/lib/news'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind') ?? 'trending'
  const articles = await getTrendingArticles(kind)
  return NextResponse.json({ articles })
}
