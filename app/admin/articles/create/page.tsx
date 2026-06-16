import { ArticleForm } from '@/components/admin/article-form'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { SupabaseConfigBanner } from '@/components/admin/supabase-config-banner'
import { AdminPageHeader } from '@/components/admin/ui'
import { getAdminCategories } from '@/lib/admin/data'
import { hasSupabaseAdminConfig } from '@/lib/supabase/config'

export default async function CreateArticlePage() {
  const categories = await getAdminCategories()
  const canPublish = hasSupabaseAdminConfig()

  return (
    <ProtectedAdminPage>
      <SupabaseConfigBanner />
      <AdminPageHeader title="Publish Article" description="Write your story and publish it live on BDL News." />
      <ArticleForm categories={categories} canPublish={canPublish} />
    </ProtectedAdminPage>
  )
}
