'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { saveArticle } from '@/app/admin/actions'
import { Field, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'

const statuses = ['draft', 'review', 'scheduled', 'published', 'archived', 'breaking']

export function ArticleForm({
  article,
  categories,
}: {
  article?: Record<string, any> | null
  categories: Record<string, any>[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [articleId, setArticleId] = useState(article?.id ?? '')
  const [categoryName, setCategoryName] = useState(article?.category ?? article?.categories?.name ?? '')
  const [autosaveState, setAutosaveState] = useState('Draft autosaves every 30 seconds')
  const [isPending, startTransition] = useTransition()

  function values() {
    const form = formRef.current
    if (!form) return {}
    const data = new FormData(form)
    return Object.fromEntries(data.entries())
  }

  async function autosave() {
    const payload = { ...values(), id: articleId } as Record<string, FormDataEntryValue | string>
    if (!String(payload.headline ?? '').trim()) return
    setAutosaveState('Autosaving...')
    const response = await fetch('/api/articles/autosave', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (response.ok) {
      setArticleId(result.id)
      setAutosaveState(`Autosaved at ${new Date().toLocaleTimeString()}`)
    } else {
      setAutosaveState(result.error ?? 'Autosave failed')
    }
  }

  async function uploadMedia(file: File, target: 'featured_image' | 'video_url' | 'gallery_images') {
    const formData = new FormData()
    formData.set('file', file)
    formData.set('type', file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'document')
    formData.set('folder', target === 'video_url' ? 'videos' : 'articles')
    const response = await fetch('/api/media', { method: 'POST', body: formData })
    const result = await response.json()
    if (!response.ok) {
      setAutosaveState(result.error ?? 'Upload failed')
      return
    }
    const input = formRef.current?.elements.namedItem(target) as HTMLInputElement | null
    if (!input) return
    input.value = target === 'gallery_images' && input.value ? `${input.value}, ${result.media.url}` : result.media.url
    setAutosaveState('Media uploaded')
  }

  async function runAi(action: string) {
    const payload = { ...values(), articleId }
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, action }),
    })
    const result = await response.json()
    if (!response.ok) {
      setAutosaveState(result.error ?? 'AI request failed')
      return
    }
    const map: Record<string, string> = {
      generate_headline: 'headline',
      improve_headline: 'headline',
      summarize_article: 'subtitle',
      generate_seo_description: 'seo_description',
      generate_tags: 'tags',
    }
    const target = map[action]
    const input = target ? (formRef.current?.elements.namedItem(target) as HTMLInputElement | HTMLTextAreaElement | null) : null
    if (input) input.value = result.text
    setAutosaveState('AI response applied')
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      startTransition(() => {
        void autosave()
      })
    }, 30000)
    return () => window.clearInterval(id)
  }, [articleId])

  return (
    <form ref={formRef} action={saveArticle} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {articleId && <input type="hidden" name="id" value={articleId} />}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Headline">
          <input className={inputClass} name="headline" defaultValue={article?.headline ?? article?.title ?? ''} required />
        </Field>
        <Field label="Slug">
          <input className={inputClass} name="slug" defaultValue={article?.slug ?? ''} />
        </Field>
      </div>
      <Field label="Subtitle">
        <input className={inputClass} name="subtitle" defaultValue={article?.subtitle ?? article?.dek ?? ''} />
      </Field>
      <Field label="Content">
        <textarea className={`${inputClass} min-h-56`} name="content" defaultValue={article?.content ?? ''} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => runAi('generate_headline')}>Sonke: Generate headline</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => runAi('improve_headline')}>Sonke: Improve headline</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => runAi('summarize_article')}>Sonke: Summarize</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => runAi('explain_like_15')}>Sonke: Explain</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => runAi('generate_seo_description')}>Sonke: SEO description</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => runAi('generate_tags')}>Sonke: Generate tags</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Category">
          <select
            className={inputClass}
            name="category_id"
            defaultValue={article?.category_id ?? article?.category ?? ''}
            onChange={(event) => setCategoryName(event.currentTarget.selectedOptions[0]?.textContent ?? '')}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input type="hidden" name="category_name" value={categoryName} />
        </Field>
        <Field label="Status">
          <select className={inputClass} name="status" defaultValue={article?.status ?? 'draft'}>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Featured Image URL">
          <input className={inputClass} name="featured_image" defaultValue={article?.featured_image ?? article?.image_url ?? article?.image ?? ''} />
          <input className="mt-2 text-sm" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadMedia(event.target.files[0], 'featured_image')} />
        </Field>
        <Field label="Gallery URLs">
          <input className={inputClass} name="gallery_images" defaultValue={(article?.gallery_images ?? []).join(', ')} />
          <input className="mt-2 text-sm" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadMedia(event.target.files[0], 'gallery_images')} />
        </Field>
        <Field label="Video URL">
          <input className={inputClass} name="video_url" defaultValue={article?.video_url ?? ''} />
          <input className="mt-2 text-sm" type="file" accept="video/*" onChange={(event) => event.target.files?.[0] && uploadMedia(event.target.files[0], 'video_url')} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="SEO Title">
          <input className={inputClass} name="seo_title" defaultValue={article?.seo_title ?? ''} />
        </Field>
        <Field label="SEO Description">
          <input className={inputClass} name="seo_description" defaultValue={article?.seo_description ?? ''} />
        </Field>
        <Field label="SEO Keywords">
          <input className={inputClass} name="seo_keywords" defaultValue={(article?.seo_keywords ?? article?.tags ?? []).join(', ')} />
        </Field>
      </div>
      <Field label="Tags">
        <input className={inputClass} name="tags" defaultValue={(article?.tags ?? article?.seo_keywords ?? []).join(', ')} />
      </Field>
      <Field label="Publish Date">
        <input
          className={inputClass}
          type="datetime-local"
          name="publish_date"
          defaultValue={
            article?.publish_date
              ? String(article.publish_date).slice(0, 16)
              : article?.published_at
              ? String(article.published_at).slice(0, 16)
              : ''
          }
        />
      </Field>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{isPending ? 'Autosave queued...' : autosaveState}</p>
        <Button type="submit">Save article</Button>
      </div>
    </form>
  )
}
