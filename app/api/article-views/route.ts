import { NextResponse } from 'next/server'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

function deviceFromUserAgent(userAgent: string | null) {
  const value = userAgent ?? ''
  if (/mobile/i.test(value)) return 'mobile'
  if (/tablet|ipad/i.test(value)) return 'tablet'
  return 'desktop'
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ ok: true, tracked: false })

  const body = await request.json().catch(() => ({}))
  const articleId = String(body.articleId ?? '')
  if (!articleId) return NextResponse.json({ error: 'articleId is required' }, { status: 400 })

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('article_views').insert({
    article_id: articleId,
    country: request.headers.get('x-vercel-ip-country') ?? body.country ?? null,
    city: request.headers.get('x-vercel-ip-city') ?? body.city ?? null,
    device_type: body.deviceType ?? deviceFromUserAgent(request.headers.get('user-agent')),
    source: body.source ?? null,
    reading_time_seconds: Number(body.readingTimeSeconds ?? 0),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await (supabase as any).rpc('increment_article_view', { target_article: articleId })
  return NextResponse.json({ ok: true, tracked: true })
}
