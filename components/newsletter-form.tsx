'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

export function NewsletterForm() {
  const [message, setMessage] = useState('')

  async function subscribe(formData: FormData) {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: formData.get('email') }),
    })
    setMessage(response.ok ? 'Subscribed' : 'Subscription failed')
  }

  return (
    <form action={subscribe} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="Email address"
        className="min-h-12 flex-1 border border-black/30 bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center gap-2 bg-foreground px-6 text-xs font-black uppercase text-background transition hover:bg-card hover:text-foreground"
      >
        <Mail className="size-4" />
        Subscribe
      </button>
      {message && <p className="text-xs font-black uppercase">{message}</p>}
    </form>
  )
}
