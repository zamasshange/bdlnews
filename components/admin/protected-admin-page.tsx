import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdminUser, roleLabels } from '@/lib/admin/auth'
import type { UserRole } from '@/lib/supabase/types'

export async function ProtectedAdminPage({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser()
  return (
    <AdminShell
      userName={user.profile.full_name ?? user.profile.email}
      role={roleLabels[user.profile.role as UserRole] ?? user.profile.role}
    >
      {children}
    </AdminShell>
  )
}
