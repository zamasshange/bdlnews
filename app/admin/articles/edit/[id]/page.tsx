import { notFound } from 'next/navigation'
import { ArticleForm } from '@/components/admin/article-form'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader } from '@/components/admin/ui'
import { getAdminCategories } from '@/lib/admin/data'
import { hasSupabaseAdminConfig, supabaseNewsTable } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!hasSupabaseAdminConfig()) notFound()

  const supabase = createSupabaseAdminClient()
  const table = supabaseNewsTable
  const { data: article } = await (table === 'articles'
    ? supabase.from('articles').select('*, authors(name), categories(name)').eq('id', id).maybeSingle()
    : supabase.from(table).select('*').eq('id', id).maybeSingle())

  if (!article) notFound()

  const categories = await getAdminCategories()

  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Edit Article" description="Update your story and republish when ready." />
      <ArticleForm article={article} categories={categories} />
    </ProtectedAdminPage>
  )
}
