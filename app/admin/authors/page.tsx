import { saveAuthor } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Field, Td, Th, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'

export default async function AuthorsPage() {
  const { authors } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Authors" description="Manage newsroom profiles, images, bios, social links, roles, and expertise." />
      <form action={saveAuthor} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <Field label="Name"><input className={inputClass} name="name" required /></Field>
        <Field label="Role"><input className={inputClass} name="role" /></Field>
        <Field label="Profile Image"><input className={inputClass} name="profile_image" /></Field>
        <Field label="Expertise"><input className={inputClass} name="expertise" placeholder="Politics, Economy" /></Field>
        <Field label="X"><input className={inputClass} name="x" /></Field>
        <Field label="LinkedIn"><input className={inputClass} name="linkedin" /></Field>
        <div className="md:col-span-3"><Field label="Bio"><textarea className={`${inputClass} min-h-24`} name="bio" /></Field></div>
        <Button type="submit">Save author</Button>
      </form>
      <AdminTable>
        <thead><tr><Th>Name</Th><Th>Role</Th><Th>Expertise</Th><Th>Created</Th></tr></thead>
        <tbody>{authors.map((author: any) => <tr key={author.id}><Td className="font-semibold text-slate-950">{author.name}</Td><Td>{author.role}</Td><Td>{(author.expertise ?? []).join(', ')}</Td><Td>{new Date(author.created_at).toLocaleDateString()}</Td></tr>)}</tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
