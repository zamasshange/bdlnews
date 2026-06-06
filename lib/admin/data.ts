import 'server-only'

import { hasSupabaseAdminConfig } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  if (!hasSupabaseAdminConfig()) {
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      scheduledArticles: 0,
      breakingStories: 0,
      totalAuthors: 0,
      totalViews: 0,
      todayViews: 0,
      activeReaders: 0,
    }
  }

  const supabase = createSupabaseAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    scheduledArticles,
    breakingStories,
    totalAuthors,
    totalViews,
    todayViews,
  ] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'breaking'),
    supabase.from('authors').select('id', { count: 'exact', head: true }),
    supabase.from('article_views').select('id', { count: 'exact', head: true }),
    supabase.from('article_views').select('id', { count: 'exact', head: true }).gte('viewed_at', today.toISOString()),
  ])

  return {
    totalArticles: totalArticles.count ?? 0,
    publishedArticles: publishedArticles.count ?? 0,
    draftArticles: draftArticles.count ?? 0,
    scheduledArticles: scheduledArticles.count ?? 0,
    breakingStories: breakingStories.count ?? 0,
    totalAuthors: totalAuthors.count ?? 0,
    totalViews: totalViews.count ?? 0,
    todayViews: todayViews.count ?? 0,
    activeReaders: Math.max(0, Math.round((todayViews.count ?? 0) / 6)),
  }
}

export async function getViewsByDay(days = 7) {
  if (!hasSupabaseAdminConfig()) return []
  const supabase = createSupabaseAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('article_views')
    .select('viewed_at')
    .gte('viewed_at', since.toISOString())
    .order('viewed_at', { ascending: true })

  if (error || !data) return []

  const buckets = new Map<string, number>()
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since)
    date.setDate(since.getDate() + i)
    buckets.set(date.toISOString().slice(0, 10), 0)
  }
  data.forEach((view) => {
    const key = String(view.viewed_at).slice(0, 10)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  })

  return Array.from(buckets.entries()).map(([day, views]) => ({
    day: new Date(`${day}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }),
    views,
  }))
}

export async function getAdminCollections() {
  if (!hasSupabaseAdminConfig()) {
    return { articles: [], authors: [], categories: [], comments: [], media: [], liveUpdates: [], users: [] }
  }

  const supabase = createSupabaseAdminClient()
  const [articles, authors, categories, comments, media, liveUpdates, users] = await Promise.all([
    supabase.from('articles').select('*, authors(name), categories(name)').order('updated_at', { ascending: false }).limit(100),
    supabase.from('authors').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('comments').select('*, articles(headline)').order('created_at', { ascending: false }).limit(100),
    supabase.from('media').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('live_updates').select('*, categories(name)').order('published_at', { ascending: false }).limit(100),
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  return {
    articles: articles.data ?? [],
    authors: authors.data ?? [],
    categories: categories.data ?? [],
    comments: comments.data ?? [],
    media: media.data ?? [],
    liveUpdates: liveUpdates.data ?? [],
    users: users.data ?? [],
  }
}
