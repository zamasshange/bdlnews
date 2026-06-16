import { Suspense } from 'react'
import { ArticlesTable } from '@/components/admin/articles-table'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { SupabaseConfigBanner } from '@/components/admin/supabase-config-banner'
import AdminLoading from '../loading'

export default function AdminArticlesPage() {
  return (
    <ProtectedAdminPage>
      <SupabaseConfigBanner />
      <Suspense fallback={<AdminLoading />}>
        <ArticlesTable />
      </Suspense>
    </ProtectedAdminPage>
  )
}
