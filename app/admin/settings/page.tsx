import { saveSetting } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, Field, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Settings" description="Store global newsroom settings in Supabase for the public website and dashboard." />
      <form action={saveSetting} className="grid max-w-2xl gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Field label="Setting key"><input className={inputClass} name="key" placeholder="homepage_priority" required /></Field>
        <Field label="Value"><textarea className={`${inputClass} min-h-32`} name="value" required /></Field>
        <Button type="submit">Save setting</Button>
      </form>
    </ProtectedAdminPage>
  )
}
