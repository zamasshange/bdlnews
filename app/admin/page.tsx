import { Suspense } from 'react'
import { DashboardContent } from '@/components/admin/dashboard-content'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import AdminLoading from './loading'

export default function AdminDashboardPage() {
  return (
    <ProtectedAdminPage>
      <Suspense fallback={<AdminLoading />}>
        <DashboardContent />
      </Suspense>
    </ProtectedAdminPage>
  )
}
