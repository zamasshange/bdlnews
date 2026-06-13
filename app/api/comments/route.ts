import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ comments: [] })
  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get('articleId')
  if (!articleId) return NextResponse.json({ error: 'articleId is required' }, { status: 400 })

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ comments: [] })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const articleId = String(body.articleId ?? '')
  const authorName = String(body.authorName ?? '').trim()
  const commentBody = String(body.body ?? '').trim()

  if (!articleId || !authorName || !commentBody) {
    return NextResponse.json({ error: 'articleId, authorName, and body are required' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id: articleId,
      parent_id: body.parentId || null,
      author_name: authorName,
      author_email: body.authorEmail || null,
      body: commentBody,
      status: 'approved',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/article/[slug]', 'page')
  return NextResponse.json({ comment: data })
}
