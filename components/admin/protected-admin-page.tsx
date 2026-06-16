import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdminUser, roleLabels } from '@/lib/admin/auth'
import type { UserRole } from '@/lib/supabase/types'

export async function ProtectedAdminPage({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser()
  const userName = user.profile.full_name ?? user.profile.email
  const role = roleLabels[user.profile.role as UserRole] ?? user.profile.role

  return <AdminShell userName={userName} role={role}>{children}</AdminShell>
}
