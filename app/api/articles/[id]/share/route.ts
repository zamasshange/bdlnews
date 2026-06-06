import { NextResponse } from 'next/server'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  const message = (error as { message?: string }).message
  return code === '42703' || typeof message === 'string' && message.includes('column "share_count" does not exist')
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable
  const { data: article, error: readError } = await supabase.from(table).select('share_count').eq('id', id).single()
  if (readError) {
    if (isMissingColumnError(readError)) return NextResponse.json({ shareCount: 0 })
    return NextResponse.json({ error: readError.message }, { status: 400 })
  }
  if (!article || typeof article.share_count === 'undefined') return NextResponse.json({ shareCount: 0 })

  const { data, error } = await supabase
    .from(table)
    .update({ share_count: Number(article.share_count ?? 0) + 1 })
    .eq('id', id)
    .select('share_count')
    .single()
  if (error) {
    if (isMissingColumnError(error)) return NextResponse.json({ shareCount: 0 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ shareCount: data.share_count })
}
