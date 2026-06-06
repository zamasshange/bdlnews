import { saveLiveUpdate } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Field, Td, Th, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'

export default async function LiveNewsPage() {
  const { liveUpdates, categories } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Live News" description="Create live stories, breaking updates, pinned alerts, and reader-count signals." />
      <form action={saveLiveUpdate} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <Field label="Headline"><input className={inputClass} name="headline" required /></Field>
        <Field label="Category"><select className={inputClass} name="category_id"><option value="">General</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Status"><select className={inputClass} name="status"><option>live</option><option>updated</option><option>breaking</option></select></Field>
        <Field label="Readers"><input className={inputClass} name="reader_count" type="number" defaultValue="0" /></Field>
        <div className="md:col-span-4"><Field label="Body"><textarea className={`${inputClass} min-h-24`} name="body" /></Field></div>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="pinned" /> Pin update</label>
        <Button type="submit">Publish live update</Button>
      </form>
      <AdminTable>
        <thead><tr><Th>Headline</Th><Th>Status</Th><Th>Pinned</Th><Th>Readers</Th><Th>Published</Th></tr></thead>
        <tbody>{liveUpdates.map((item: any) => <tr key={item.id}><Td className="font-semibold text-slate-950">{item.headline}</Td><Td>{item.status}</Td><Td>{item.pinned ? 'Yes' : 'No'}</Td><Td>{item.reader_count}</Td><Td>{new Date(item.published_at).toLocaleString()}</Td></tr>)}</tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
