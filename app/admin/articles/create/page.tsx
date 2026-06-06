import { ArticleForm } from '@/components/admin/article-form'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader } from '@/components/admin/ui'
import { getAdminCollections } from '@/lib/admin/data'

export default async function CreateArticlePage() {
  const { authors, categories } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Create Article" description="Compose a story and choose whether it stays draft, goes to review, schedules, publishes, or breaks live." />
      <ArticleForm authors={authors} categories={categories} />
    </ProtectedAdminPage>
  )
}
