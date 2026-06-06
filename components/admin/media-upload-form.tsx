'use client'

import { useState } from 'react'
import { Field, inputClass } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'

export function MediaUploadForm() {
  const [message, setMessage] = useState('')

  async function upload(formData: FormData) {
    setMessage('Uploading...')
    const response = await fetch('/api/media', { method: 'POST', body: formData })
    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error ?? 'Upload failed')
      return
    }
    setMessage('Upload complete')
    window.location.reload()
  }

  return (
    <form action={upload} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
      <Field label="File"><input className={inputClass} name="file" type="file" required /></Field>
      <Field label="Type"><select className={inputClass} name="type"><option>image</option><option>video</option><option>document</option></select></Field>
      <Field label="Folder"><input className={inputClass} name="folder" defaultValue="uploads" /></Field>
      <div className="flex items-end gap-3">
        <Button type="submit">Upload media</Button>
        <p className="text-xs text-slate-500">{message}</p>
      </div>
    </form>
  )
}
