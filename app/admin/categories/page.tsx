import { saveCategory } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Field, Td, Th, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'

export default async function CategoriesPage() {
  const { categories } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Categories" description="Control public category feeds and article classification." />
      <form action={saveCategory} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <Field label="Name"><input className={inputClass} name="name" required /></Field>
        <Field label="Slug"><input className={inputClass} name="slug" /></Field>
        <Field label="Description"><input className={inputClass} name="description" /></Field>
        <Button type="submit">Save category</Button>
      </form>
      <AdminTable>
        <thead><tr><Th>Name</Th><Th>Slug</Th><Th>Description</Th><Th>Created</Th></tr></thead>
        <tbody>{categories.map((category: any) => <tr key={category.id}><Td className="font-semibold text-slate-950">{category.name}</Td><Td>{category.slug}</Td><Td>{category.description}</Td><Td>{new Date(category.created_at).toLocaleDateString()}</Td></tr>)}</tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
