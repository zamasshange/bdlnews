import 'server-only'

import { redirect } from 'next/navigation'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  journalist: 'Journalist',
}

export async function getAdminUser() {
  if (!hasSupabaseConfig()) return null

  const client = await createSupabaseServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) return null

  let profile = null as Record<string, any> | null
  let profileExists = false

  const adminClient = createSupabaseAdminClient()

  try {
    const { data, error } = await adminClient.from('users').select('*').eq('id', user.id).maybeSingle()
    if (!error && data) {
      profile = data
      profileExists = true
    }
  } catch {
    // ignore lookup failures when the users table is not available
  }

  if (!profile) {
    const fallbackProfile = {
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email ?? 'BDL User',
      role: 'journalist',
      avatar_url: null,
      created_at: user.created_at,
    }

    if (!profileExists) {
      try {
        const { data: inserted, error } = await adminClient.from('users').insert(fallbackProfile).single()
        if (!error && inserted) {
          profile = inserted
          profileExists = true
        }
      } catch {
        // if the users table is unavailable, fall back to the auth user metadata without throwing.
      }
    }

    if (!profile) {
      profile = fallbackProfile
    }
  }

  return {
    auth: user,
    profile,
    profileExists,
  }
}

export async function requireAdminUser() {
  const user = await getAdminUser()
  if (!user) redirect('/admin/login')
  return user
}
