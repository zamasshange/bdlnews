import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const type = String(body.type ?? '').trim()
  const message = String(body.message ?? '').trim()
  const anonymous = Boolean(body.anonymous)

  if (!message || (!name && !anonymous)) {
    return NextResponse.json({ error: 'Please provide a message and either a name or enable anonymous submission.' }, { status: 400 })
  }

  // Store or forward securely in production.
  console.log('Contact form submission:', { name: anonymous ? 'Anonymous' : name, email, type, anonymous, message })

  return NextResponse.json({ success: true, message: 'Your submission has been received. BDL News will respond within 48 hours.' })
}
