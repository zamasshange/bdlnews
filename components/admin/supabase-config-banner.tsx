import { hasSupabaseAdminConfig } from '@/lib/supabase/config'

export function SupabaseConfigBanner() {
  if (hasSupabaseAdminConfig()) return null

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Publishing is not connected yet.</p>
      <p className="mt-1 text-amber-900">
        Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to your environment so articles can save to the site.
      </p>
    </div>
  )
}
