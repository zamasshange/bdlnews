'use client'

import { useState } from 'react'
import { SiteShell } from '@/components/site-shell'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', type: 'General Enquiry', message: '', anonymous: false })
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(formState),
      })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error ?? 'Unable to send your message. Please try again later.')
      } else {
        setStatus(payload.message || 'Your message was sent successfully.')
        setFormState({ name: '', email: '', type: 'General Enquiry', message: '', anonymous: false })
      }
    } catch (err) {
      setError('Network error while submitting the contact form.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SiteShell showTicker>
      <section className="jox-container py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase text-primary tracking-[0.32em]">Contact Us</p>
            <h1 className="text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Reach the newsroom, news tips, or support the BDL platform.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Whether you have a story idea, a partnership request, or a secure tip, this page connects you directly with the editorial and technical teams.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            <p className="text-xs font-black uppercase text-primary">Response expectations</p>
            <p className="mt-4 text-sm text-muted-foreground">We aim to respond to most inquiries within 48 hours. Secure tips are handled with the utmost discretion.</p>
          </div>
        </div>
      </section>

      <section className="jox-container py-10">
        <div className="grid gap-10 lg:grid-cols-[0.55fr_0.45fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border bg-white p-8 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  placeholder="Your name"
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                  placeholder="you@example.com"
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Enquiry type
              <select
                value={formState.type}
                onChange={(event) => setFormState({ ...formState, type: event.target.value })}
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option>General Enquiry</option>
                <option>Editorial Team</option>
                <option>News Tips</option>
                <option>Partnerships</option>
                <option>Advertising</option>
                <option>Technical Support</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Message
              <textarea
                value={formState.message}
                onChange={(event) => setFormState({ ...formState, message: event.target.value })}
                placeholder="Tell us about your story, tip, or request."
                rows={6}
                className="min-h-[10rem] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formState.anonymous}
                onChange={(event) => setFormState({ ...formState, anonymous: event.target.checked })}
                className="rounded border border-slate-300 bg-white text-primary focus:ring-primary"
              />
              Submit anonymously (secure tip)
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {status && <p className="text-sm text-green-700">{status}</p>}
                {error && <p className="text-sm text-red-700">{error}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </form>

          <aside className="space-y-6 rounded-3xl border border-border bg-card p-8">
            <div>
              <p className="text-xs font-black uppercase text-primary">Contact details</p>
              <p className="mt-4 text-sm text-muted-foreground">For general enquiries or media partnerships, email:</p>
              <p className="mt-3 font-semibold text-foreground">support@bdl.news</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-primary">News tips</p>
              <p className="mt-4 text-sm text-muted-foreground">Use the form above to send a tip securely. If you prefer, include a note about confidentiality and your preferred contact method.</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-primary">Office</p>
              <p className="mt-4 text-sm text-muted-foreground">BDL Corp</p>
              <p>Johannesburg, South Africa</p>
              <p className="mt-2">Response time: within 48 hours</p>
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  )
}
