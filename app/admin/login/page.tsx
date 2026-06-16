import { redirect } from 'next/navigation'
import { isAdminAuthEnabled } from '@/lib/admin/auth'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hasSupabaseConfig } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function login(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })
  if (error) redirect('/admin/login?error=1')
  redirect('/admin?login=success')
}

export default function AdminLoginPage() {
  if (!isAdminAuthEnabled()) {
    redirect('/admin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-4">
      <form action={login} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase text-primary">BDL News</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-500">
          Use a Supabase authenticated account with a newsroom role.
        </p>
        {!hasSupabaseConfig() && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Supabase environment variables are not configured yet.
          </p>
        )}
        <label className="mt-5 grid gap-1.5 text-sm font-medium text-slate-700">
          Email
          <input className="min-h-10 rounded-md border border-slate-300 px-3" type="email" name="email" required />
        </label>
        <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
          Password
          <input className="min-h-10 rounded-md border border-slate-300 px-3" type="password" name="password" required />
        </label>
        <Button className="mt-5 w-full" type="submit">
          <LogIn className="size-4" />
          Sign in
        </Button>
      </form>
    </main>
  )
}
