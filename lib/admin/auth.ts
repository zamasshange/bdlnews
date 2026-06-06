import 'server-only'

import { redirect } from 'next/navigation'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  journalist: 'Journalist',
}

export async function getAdminUser() {
  if (!hasSupabaseConfig()) return null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return {
    auth: user,
    profile: profile ?? {
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email ?? 'BDL User',
      role: 'journalist' as const,
      avatar_url: null,
      created_at: user.created_at,
    },
  }
}

export async function requireAdminUser() {
  const user = await getAdminUser()
  if (!user) redirect('/admin/login')
  return user
}
