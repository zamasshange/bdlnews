import { Copy, ExternalLink } from 'lucide-react'
import { saveMediaRecord } from '@/app/admin/actions'
import { MediaUploadForm } from '@/components/admin/media-upload-form'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Field, Td, Th, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'

export default async function MediaPage() {
  const { media } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Media Library" description="Track Supabase Storage assets for images, videos, and documents used by stories." />
      <MediaUploadForm />
      <form action={saveMediaRecord} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <Field label="Name"><input className={inputClass} name="name" required /></Field>
        <Field label="Public URL"><input className={inputClass} name="url" required /></Field>
        <Field label="Type"><select className={inputClass} name="type"><option>image</option><option>video</option><option>document</option></select></Field>
        <Field label="Folder"><input className={inputClass} name="folder" /></Field>
        <Button type="submit">Add media record</Button>
      </form>
      <AdminTable>
        <thead><tr><Th>Name</Th><Th>Type</Th><Th>Folder</Th><Th>URL</Th><Th>Added</Th></tr></thead>
        <tbody>{media.map((item: any) => <tr key={item.id}><Td className="font-semibold text-slate-950">{item.name}</Td><Td>{item.type}</Td><Td>{item.folder}</Td><Td><a className="inline-flex items-center gap-2 text-primary" href={item.url} target="_blank"><ExternalLink className="size-4" /> Open</a></Td><Td>{new Date(item.created_at).toLocaleDateString()} <Copy className="ml-2 inline size-3" /></Td></tr>)}</tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
