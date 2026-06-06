import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/auth'
import { geminiApiKey, hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import type { AiActionType } from '@/lib/supabase/types'

const instructions: Record<AiActionType, string> = {
  generate_headline: 'Generate five strong, accurate news headlines for a modern newsroom.',
  improve_headline: 'Improve this headline. Return three clearer, punchier headline options.',
  generate_subtitle: 'Generate a short subtitle or deck that explains the article in one sentence.',
  generate_seo_title: 'Write an SEO title for this article under 60 characters.',
  generate_seo_description: 'Write a search-friendly meta description under 155 characters.',
  generate_seo_keywords: 'Generate 8 relevant SEO keywords as a comma-separated list.',
  generate_social_description: 'Write a social sharing description that is engaging and concise.',
  generate_og_title: 'Write an Open Graph title suitable for social sharing.',
  generate_og_description: 'Write an Open Graph description that highlights why this story matters.',
  generate_twitter_description: 'Write a Twitter/X description that fits the article and encourages clicks.',
  generate_google_discover_description: 'Write a Google Discover description that feels topical and engaging.',
  generate_tags: 'Generate 8 relevant tags as a comma-separated list.',
  suggest_categories: 'Suggest 3 relevant categories for this article.',
  summarize_article: 'Summarize the article in three concise bullet points.',
  generate_summary: 'Generate a short article summary for a reader who needs the main points fast.',
  generate_key_facts: 'Extract 5 key facts from this content.',
  generate_pull_quote: 'Generate a memorable pull quote from this content.',
  improve_grammar: 'Improve the grammar and clarity of this paragraph while preserving meaning.',
  improve_clarity: 'Rewrite this paragraph to improve clarity and flow without changing the meaning.',
  expand_paragraph: 'Expand this paragraph with more detail while keeping it concise and reader-friendly.',
  shorten_paragraph: 'Shorten this paragraph while keeping the main idea intact.',
  detect_bias: 'Check this content for bias, framing, or one-sided language and explain what you find.',
  suggest_sources: 'Suggest three credible source types or story angles that a journalist could use to support this article.',
  generate_image_metadata: 'Generate alt text and a short caption for this image that supports the story and improves SEO.',
}

function buildPrompt(action: AiActionType, body: any) {
  const prompt = [instructions[action]]

  if (body.headline) prompt.push(`Headline: ${body.headline}`)
  if (body.subtitle) prompt.push(`Subtitle: ${body.subtitle}`)
  if (body.content) prompt.push(`Article: ${body.content}`)
  if (body.blockText) prompt.push(`Block text: ${body.blockText}`)
  if (body.imageUrl) prompt.push(`Image URL: ${body.imageUrl}`)
  if (body.field) prompt.push(`Target field: ${body.field}`)

  return prompt.filter(Boolean).join('\n\n')
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
      return content.map((item) => (typeof item.text === 'string' ? item.text : '')).filter(Boolean).join('\n').trim()
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

export async function POST(request: Request) {
  const user = await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  if (!geminiApiKey) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const action = String(body.action ?? '') as AiActionType
  if (!instructions[action]) return NextResponse.json({ error: 'Unsupported AI action' }, { status: 400 })

  const prompt = buildPrompt(action, body)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 500 },
      }),
    },
  )

  if (!response.ok) {
    return NextResponse.json({ error: await response.text() }, { status: 502 })
  }

  const payload = await response.json()
  const text = parseOpenRouterResult(payload)
  const supabase = createSupabaseAdminClient()
  const inserted = await supabase
    .from('ai_generations')
    .insert({
      article_id: body.articleId || null,
      action,
      prompt,
      response: { text },
      created_by: user.auth.id,
    })
    .select()
    .single()

  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 400 })
  return NextResponse.json({ generation: inserted.data, text })
}
