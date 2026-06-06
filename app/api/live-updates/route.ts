import { NextResponse } from 'next/server'
import { getLiveUpdates } from '@/lib/news'

export async function GET() {
  const updates = await getLiveUpdates()
  return NextResponse.json({ updates })
}
