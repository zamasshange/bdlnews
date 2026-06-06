import { NextResponse } from 'next/server'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

function fingerprint(request: Request) {
  return [
    request.headers.get('x-forwarded-for')?.split(',')[0],
    request.headers.get('user-agent'),
  ]
    .filter(Boolean)
    .join('|')
    .slice(0, 200)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const inserted = await supabase.from('comment_likes').insert({ comment_id: id, fingerprint: fingerprint(request) || 'anonymous' })
  if (inserted.error && inserted.error.code !== '23505') {
    return NextResponse.json({ error: inserted.error.message }, { status: 400 })
  }
  const { count } = await supabase.from('comment_likes').select('id', { count: 'exact', head: true }).eq('comment_id', id)
  const { data, error } = await supabase.from('comments').update({ likes: count ?? 0 }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ comment: data })
}
