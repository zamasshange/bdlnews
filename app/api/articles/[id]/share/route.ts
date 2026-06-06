import { NextResponse } from 'next/server'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const { data: article, error: readError } = await supabase.from('articles').select('share_count').eq('id', id).single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 })
  const { data, error } = await supabase
    .from('articles')
    .update({ share_count: Number(article.share_count ?? 0) + 1 })
    .eq('id', id)
    .select('share_count')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ shareCount: data.share_count })
}
