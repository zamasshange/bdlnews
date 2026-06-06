import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin/auth'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ article: null }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from('articles').select('*, authors(*), categories(*)').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ article: data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('articles').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/')
  revalidatePath('/article/[slug]', 'page')
  revalidatePath('/category/[slug]', 'page')
  return NextResponse.json({ article: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
