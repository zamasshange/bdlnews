import { notFound } from 'next/navigation'
import { ArticleForm } from '@/components/admin/article-form'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader } from '@/components/admin/ui'
import { getAdminCollections } from '@/lib/admin/data'

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { articles, categories } = await getAdminCollections()
  const article = articles.find((item: any) => String(item.id) === String(id))
  if (!article) notFound()

  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Edit Article" description="Update editorial fields, SEO, media, scheduling, and publishing status." />
      <ArticleForm article={article} categories={categories} />
    </ProtectedAdminPage>
  )
}
