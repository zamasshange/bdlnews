'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function NewsletterForm({ variant = 'default' }: { variant?: 'default' | 'footer' | 'cta' }) {
  const [message, setMessage] = useState('')
  const isFooter = variant === 'footer'
  const isCta = variant === 'cta'

  async function subscribe(formData: FormData) {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: formData.get('email') }),
    })
    setMessage(response.ok ? 'Subscribed' : 'Subscription failed')
  }

  return (
    <form action={subscribe} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="sr-only" htmlFor="newsletter-email">
        Email
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Enter your email address"
        className={cn(
          'min-h-12 flex-1 rounded-full px-5 text-sm outline-none',
          isFooter || isCta
            ? 'border border-white/15 bg-white/8 text-white placeholder:text-white/45'
            : 'border border-border bg-background text-foreground placeholder:text-muted-foreground',
        )}
      />
      <button
        type="submit"
        className={cn(
          'inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition',
          isFooter || isCta
            ? 'bg-white text-brand-navy hover:bg-white/90'
            : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground',
        )}
      >
        Subscribe
      </button>
      {message ? (
        <p className={cn('text-xs font-medium', isFooter || isCta ? 'text-white/75' : 'text-muted-foreground')}>
          {message}
        </p>
      ) : null}
    </form>
  )
}
