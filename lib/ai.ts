import 'server-only'

const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.NVIDIA_API_KEY ?? process.env.NEXT_PUBLIC_NVIDIA_API_KEY ?? ''
const model = process.env.OPENROUTER_MODEL ?? process.env.NVIDIA_MODEL ?? 'gpt-4o-mini'
const apiUrl = process.env.OPENROUTER_API_URL ?? 'https://openrouter.ai/v1/chat/completions'

function safeText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function parseNvidiaResult(payload: any): string {
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

  const systemPrompt = [
    'You are Sonke, the intelligent news assistant for a news website.',
    'Provide concise summaries, explain why stories matter, and help users filter news by topic or angle.',
    'When asked about a story, return a short, clear answer with useful next steps or related topics.',
  ].join(' ')

  const promptParts = [systemPrompt]
  if (context) promptParts.push(`Context:\n${context}`)
  promptParts.push(`User: ${message}`)
  promptParts.push('Assistant:')
  const prompt = promptParts.join('\n\n')

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
        { role: 'user', content: message },
      ],
      max_tokens: 512,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    const message = bodyText ? `NVIDIA request failed: ${response.status} ${bodyText}` : `NVIDIA request failed: ${response.status}`
    throw new Error(message)
  }

  let payload: any
  try {
    payload = await response.json()
  } catch {
    throw new Error('NVIDIA returned a non-JSON response')
  }

  const text = parseNvidiaResult(payload)
  return text || 'Sonke could not generate a response right now.'
}
