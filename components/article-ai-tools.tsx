'use client'

import { useMemo, useState } from 'react'
import { Bot } from 'lucide-react'
import { buildArticleContext } from '@/lib/article-text'

const tools = [
  { label: 'Summarize Article', prompt: 'Summarize this article in 3 short bullet points.' },
  { label: 'Explain Like I’m 15', prompt: 'Explain this article clearly for a 15-year-old reader.' },
  { label: 'Why This Matters', prompt: 'Explain why this news story matters and what readers should take away.' },
  { label: 'Key Takeaways', prompt: 'List the key takeaways from this story.' },
  { label: 'Timeline of Events', prompt: 'Summarize the timeline of events described in this article.' },
  { label: 'Who Is Involved', prompt: 'Identify the main people and organizations involved in this story.' },
  { label: 'Potential Future Outcomes', prompt: 'Describe potential future outcomes or next steps from this story.' },
  { label: 'Economic Impact', prompt: 'Explain the economic impact of this story.' },
  { label: 'Political Impact', prompt: 'Explain the political impact of this story.' },
  { label: 'Technology Impact', prompt: 'Explain the technology impact of this story.' },
  { label: 'Global Impact', prompt: 'Explain the global impact of this story.' },
  { label: 'Generate FAQ', prompt: 'Generate 5 FAQ questions and answers based on this article.' },
  { label: 'Explain Difficult Terms', prompt: 'Explain any difficult terms or phrases used in this article.' },
  { label: 'Translate Summary', prompt: 'Translate the summary of this article into clear, plain English.' },
]

export function ArticleAiTools({ article }: { article: Record<string, any> }) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [active, setActive] = useState('')
  const [loading, setLoading] = useState(false)

  const articleContext = useMemo(() => buildArticleContext(article), [article])

  async function runTool(prompt: string, label: string) {
    setActive(label)
    setLoading(true)
    setAnswer('')

    try {
      const response = await fetch('/api/sonke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context: articleContext }),
      })
      const payload = await response.json()
      setAnswer(payload.text ?? 'Sonke could not answer that right now.')
    } catch (error) {
      setAnswer('Unable to connect to Sonke. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  async function askCustom() {
    if (!query.trim()) return
    await runTool(query, 'Custom question')
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">Sonke AI</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">Understand This Story</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Sonke reads this article and helps you summarize it, explain it simply, and explore why it matters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => runTool('Summarize this article in 3 short bullet points.', 'Summarize Article')}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase text-primary-foreground transition hover:bg-primary/90"
        >
          <Bot className="size-4" /> Understand This Story
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.slice(0, 6).map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => runTool(tool.prompt, tool.label)}
            className="rounded-3xl border border-border bg-white p-4 text-left text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tools.slice(6).map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => runTool(tool.prompt, tool.label)}
            className="rounded-3xl border border-border bg-white p-4 text-left text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">Ask a question</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask Sonke about this article…"
            className="min-h-12 flex-1 rounded-2xl border border-slate-300 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={askCustom}
            disabled={loading}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            Ask
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-background p-5">
        <p className="text-sm font-semibold text-foreground">{active || 'Ready to answer'}</p>
        <div className="mt-4 min-h-[8rem] text-sm leading-7 text-muted-foreground">
          {loading ? 'Sonke is analyzing the story...' : answer || 'Choose a tool or ask a question to get an answer based on this article.'}
        </div>
      </div>
    </section>
  )
}
