import 'server-only'

import { buildSonkeNewsBriefing } from '@/lib/sonke-context'
import { siteConfig } from '@/lib/site'

const apiKey = process.env.OPENROUTER_API_KEY ?? ''
const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
const apiUrl = process.env.OPENROUTER_API_URL ?? 'https://openrouter.ai/api/v1/chat/completions'

function safeText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function parseOpenRouterResult(payload: any): string {
  if (!payload) return ''
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }
  const outputs = payload.outputs ?? payload.output ?? []
  if (Array.isArray(outputs) && outputs.length > 0) {
    const output = outputs[0]
    const content = output.content ?? output.text ?? output.output_text ?? null
    if (typeof content === 'string' && content.trim()) return content.trim()
    if (Array.isArray(content)) {
      return content.map((item) => safeText(item.text)).filter(Boolean).join('\n').trim()
    }
  }
  const choices = payload.choices ?? []
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0]
    if (typeof first.text === 'string' && first.text.trim()) return first.text.trim()
    if (first.message && typeof first.message.content === 'string') return first.message.content.trim()
  }
  return ''
}

export async function generateSonkeReply(message: string, context?: string) {
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const newsBriefing = await buildSonkeNewsBriefing()

  const systemPrompt = [
    `You are Sonke, the live AI newsroom assistant for ${siteConfig.name} (${siteConfig.url}).`,
    'On every request you receive a LIVE NEWS BRIEFING loaded from BDL wire APIs, the editorial CMS, trending rankings, and the live ticker.',
    'This briefing is real, current site data — treat it as your primary source of truth.',
    'NEVER say you lack real-time access, cannot browse, or do not have current news.',
    'NEVER tell users to check other news websites, apps, or external sources for headlines.',
    'Answer using the briefing: cite specific headlines, categories, sources, and on-site links (/article/slug).',
    'When users ask for biggest stories, trending topics, or latest news, list concrete items from the briefing.',
    'When article context is provided, prioritize it for article-specific questions while still using the briefing for broader context.',
    'Be concise, editorial, and confident. You are embedded in the newsroom — act like it.',
  ].join(' ')

  const userContent = [
    '=== LIVE NEWS BRIEFING (use this for all news questions) ===',
    newsBriefing,
    context ? `\n=== ARTICLE CONTEXT ===\n${context}` : '',
    `\n=== USER REQUEST ===\n${message}`,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1024,
      temperature: 0.35,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    const errorMessage = bodyText
      ? `OpenRouter request failed: ${response.status} ${bodyText}`
      : `OpenRouter request failed: ${response.status}`
    throw new Error(errorMessage)
  }

  let payload: any
  try {
    payload = await response.json()
  } catch {
    throw new Error('OpenRouter returned a non-JSON response')
  }

  const text = parseOpenRouterResult(payload)
  return text || 'Sonke could not generate a response right now.'
}
