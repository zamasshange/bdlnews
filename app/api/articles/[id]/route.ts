import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin/auth'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ article: null }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable
  const { data, error } = await (table === 'articles'
    ? supabase.from(table).select('*, authors(*), categories(*)').eq('id', id).single()
    : supabase.from(table).select('*').eq('id', id).single())
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ article: data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable
  const body = await request.json().catch(() => ({}))
  const payload = table === 'articles' ? { ...body, updated_at: new Date().toISOString() } : body
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/')
  revalidatePath('/article/[slug]', 'page')
  revalidatePath('/[slug]', 'page')
  return NextResponse.json({ article: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from(supabaseNewsTable).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
