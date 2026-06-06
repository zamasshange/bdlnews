import { deleteComment, moderateComment } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Td, Th } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'

export default async function CommentsPage() {
  const { comments } = await getAdminCollections()
  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Comments" description="Moderate comments, reports, spam, hidden content, and approvals." />
      <AdminTable>
        <thead><tr><Th>Comment</Th><Th>Article</Th><Th>Status</Th><Th>Reports</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {comments.map((comment: any) => (
            <tr key={comment.id}>
              <Td><p className="font-semibold text-slate-950">{comment.author_name}</p><p>{comment.body}</p></Td>
              <Td>{comment.articles?.headline ?? 'Unknown'}</Td>
              <Td>{comment.status}</Td>
              <Td>{comment.reports}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {['approved', 'hidden', 'spam'].map((status) => (
                    <form key={status} action={moderateComment}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="status" value={status} />
                      <Button type="submit" variant="outline" size="sm">{status}</Button>
                    </form>
                  ))}
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={comment.id} />
                    <Button type="submit" variant="destructive" size="sm">delete</Button>
                  </form>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
