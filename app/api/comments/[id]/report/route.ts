import { NextResponse } from 'next/server'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const { data: comment, error: readError } = await supabase.from('comments').select('reports').eq('id', id).single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 })
  const { data, error } = await supabase
    .from('comments')
    .update({ reports: Number(comment.reports ?? 0) + 1 })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ comment: data })
}
