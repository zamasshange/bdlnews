import { NextResponse } from 'next/server'
import { fetchTwitterOembed, normalizeTwitterUrl, resolveTweetStatusUrl } from '@/lib/social-embeds'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url')?.trim()
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const statusUrl = (await resolveTweetStatusUrl(url)) ?? normalizeTwitterUrl(url)
  const html = await fetchTwitterOembed(statusUrl)

  if (!html) {
    return NextResponse.json({ statusUrl, html: null }, { status: 404 })
  }

  return NextResponse.json(
    { statusUrl, html },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
