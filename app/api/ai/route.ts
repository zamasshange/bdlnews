import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin/auth'
import { geminiApiKey, hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import type { AiActionType } from '@/lib/supabase/types'

const instructions: Record<AiActionType, string> = {
  generate_headline: 'Generate five strong, accurate news headlines.',
  improve_headline: 'Improve this headline. Return five options.',
  summarize_article: 'Summarize the article in three concise bullet points.',
  explain_like_15: 'Explain this story clearly for a 15-year-old reader.',
  generate_seo_description: 'Write a search-friendly meta description under 155 characters.',
  generate_tags: 'Generate 8 relevant tags as a comma-separated list.',
}

export async function POST(request: Request) {
  const user = await requireAdminUser()
  if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  if (!geminiApiKey) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const action = String(body.action ?? '') as AiActionType
  if (!instructions[action]) return NextResponse.json({ error: 'Unsupported AI action' }, { status: 400 })

  const prompt = [
    instructions[action],
    body.headline ? `Headline: ${body.headline}` : '',
    body.subtitle ? `Subtitle: ${body.subtitle}` : '',
    body.content ? `Article: ${body.content}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    },
  )

  if (!response.ok) {
    return NextResponse.json({ error: await response.text() }, { status: 502 })
  }

  const payload = await response.json()
  const text = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('\n').trim() ?? ''
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
