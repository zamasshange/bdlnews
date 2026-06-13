import { fetchAllExternalArticles } from '@/lib/news'

export async function GET() {
  const articles = await fetchAllExternalArticles(500)
  return Response.json({
    ok: true,
    cached: articles.length,
  })
}
