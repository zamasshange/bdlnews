import { upsertUserRole } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Td, Th, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'

const roles = ['super_admin', 'admin', 'editor', 'journalist']

export default async function UsersPage() {
  const { users } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Users" description="Manage authenticated newsroom users and dashboard permissions." />
      <AdminTable>
        <thead><tr><Th>User</Th><Th>Email</Th><Th>Role</Th><Th>Joined</Th><Th>Action</Th></tr></thead>
        <tbody>{users.map((user: any) => <tr key={user.id}><Td className="font-semibold text-slate-950">{user.full_name}</Td><Td>{user.email}</Td><Td>{user.role}</Td><Td>{new Date(user.created_at).toLocaleDateString()}</Td><Td><form action={upsertUserRole} className="flex gap-2"><input type="hidden" name="id" value={user.id} /><select className={inputClass} name="role" defaultValue={user.role}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select><Button type="submit" variant="outline">Save</Button></form></Td></tr>)}</tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
