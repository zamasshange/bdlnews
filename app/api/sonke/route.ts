import { NextResponse } from 'next/server'
import { generateSonkeReply } from '@/lib/ai'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const message = String(body.message ?? '').trim()
  const context = body.context ? String(body.context) : undefined

  if (!message) {
    return NextResponse.json({ error: 'A message is required' }, { status: 400 })
  }

  try {
    const text = await generateSonkeReply(message, context)
    return NextResponse.json({ text })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to contact Sonke' },
      { status: 502 },
    )
  }
}
