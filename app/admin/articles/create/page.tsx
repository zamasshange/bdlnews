import { ArticleForm } from '@/components/admin/article-form'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader } from '@/components/admin/ui'
import { getAdminCategories } from '@/lib/admin/data'

export default async function CreateArticlePage() {
  const categories = await getAdminCategories()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Publish Article" description="Write your story and publish it live on BDL News." />
      <ArticleForm categories={categories} />
    </ProtectedAdminPage>
  )
}
