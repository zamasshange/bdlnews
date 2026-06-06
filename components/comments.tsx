'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Comment = {
  id: string
  parent_id: string | null
  author_name: string
  body: string
  likes: number
  reports: number
  created_at: string
}

export function Comments({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [replyTo, setReplyTo] = useState<string | null>(null)

  async function load() {
    const response = await fetch(`/api/comments?articleId=${articleId}`)
    const payload = await response.json()
    setComments(payload.comments ?? [])
  }

  async function submit(formData: FormData) {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        articleId,
        parentId: replyTo,
        authorName: formData.get('authorName'),
        authorEmail: formData.get('authorEmail'),
        body: formData.get('body'),
      }),
    })
    if (response.ok) {
      setReplyTo(null)
      await load()
    }
  }

  async function action(id: string, kind: 'like' | 'report') {
    await fetch(`/api/comments/${id}/${kind}`, { method: 'POST' })
    await load()
  }

  useEffect(() => {
    void load()
  }, [articleId])

  const roots = comments.filter((comment) => !comment.parent_id)
  const replies = (id: string) => comments.filter((comment) => comment.parent_id === id)

  return (
    <section className="jox-container border-t border-border py-10">
      <p className="mb-3 text-xs font-black uppercase text-primary">Comments</p>
      <div className="grid gap-5">
        {roots.map((comment) => (
          <article key={comment.id} className="border border-border p-4">
            <p className="font-semibold text-foreground">{comment.author_name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comment.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => action(comment.id, 'like')}>Like {comment.likes}</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setReplyTo(comment.id)}>Reply</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => action(comment.id, 'report')}>Report</Button>
            </div>
            {replies(comment.id).map((reply) => (
              <div key={reply.id} className="mt-4 border-l border-border pl-4">
                <p className="font-semibold text-foreground">{reply.author_name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reply.body}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
      <form action={submit} className="mt-6 grid gap-3 border border-border p-4">
        {replyTo && <p className="text-xs font-black uppercase text-primary">Replying</p>}
        <input className="min-h-11 border border-border bg-background px-3 text-sm outline-none" name="authorName" placeholder="Name" required />
        <input className="min-h-11 border border-border bg-background px-3 text-sm outline-none" name="authorEmail" type="email" placeholder="Email" />
        <textarea className="min-h-28 border border-border bg-background p-3 text-sm outline-none" name="body" placeholder="Join the conversation" required />
        <Button type="submit">Post comment</Button>
      </form>
    </section>
  )
}
