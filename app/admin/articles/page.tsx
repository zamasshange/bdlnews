import Link from 'next/link'
import { Copy, Pencil, Send, Trash2 } from 'lucide-react'
import { deleteArticle, duplicateArticle, updateArticleStatus } from '@/app/admin/actions'
import { ProtectedAdminPage } from '@/components/admin/protected-admin-page'
import { AdminPageHeader, AdminTable, Td, Th } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { getAdminCollections } from '@/lib/admin/data'
import { supabaseNewsTable } from '@/lib/supabase/config'

export default async function AdminArticlesPage() {
  const { articles } = await getAdminCollections()

  return (
    <ProtectedAdminPage>
      <AdminPageHeader title="Articles" description="Create, edit, schedule, publish, duplicate, and archive BDL stories." actionHref="/admin/articles/create" actionLabel="Create article" />
      <AdminTable>
        <thead><tr><Th>Headline</Th><Th>Category</Th><Th>Author</Th><Th>Status</Th><Th>Publish Date</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {articles.map((article: any) => (
            <tr key={article.id}>
              <Td className="font-semibold text-slate-950">{article.headline}</Td>
              <Td>{article.categories?.name ?? 'Uncategorized'}</Td>
              <Td>{article.authors?.name ?? 'BDL Newsroom'}</Td>
              <Td>{article.status}</Td>
              <Td>{article.publish_date ? new Date(article.publish_date).toLocaleString() : 'Not set'}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100" href={`/admin/articles/edit/${article.id}`} aria-label="Edit">
                    <Pencil className="size-4" />
                  </Link>
                  <form action={duplicateArticle}><input type="hidden" name="id" value={article.id} /><Button type="submit" variant="outline" size="icon"><Copy className="size-4" /></Button></form>
                  {supabaseNewsTable === 'articles' ? (
                    <form action={updateArticleStatus}>
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="status" value="published" />
                      <Button type="submit" variant="outline" size="icon"><Send className="size-4" /></Button>
                    </form>
                  ) : null}
                  <form action={deleteArticle}><input type="hidden" name="id" value={article.id} /><Button type="submit" variant="destructive" size="icon"><Trash2 className="size-4" /></Button></form>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </ProtectedAdminPage>
  )
}
