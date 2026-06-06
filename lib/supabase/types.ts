export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived' | 'breaking'
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'journalist'
export type CommentStatus = 'pending' | 'approved' | 'hidden' | 'spam'
export type AiActionType =
  | 'generate_headline'
  | 'improve_headline'
  | 'generate_subtitle'
  | 'generate_seo_title'
  | 'generate_seo_description'
  | 'generate_seo_keywords'
  | 'generate_social_description'
  | 'generate_og_title'
  | 'generate_og_description'
  | 'generate_twitter_description'
  | 'generate_google_discover_description'
  | 'generate_tags'
  | 'suggest_categories'
  | 'summarize_article'
  | 'generate_summary'
  | 'generate_key_facts'
  | 'generate_pull_quote'
  | 'improve_grammar'
  | 'improve_clarity'
  | 'expand_paragraph'
  | 'shorten_paragraph'
  | 'detect_bias'
  | 'suggest_sources'
  | 'generate_image_metadata'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      authors: {
        Row: {
          id: string
          name: string
          profile_image: string | null
          bio: string | null
          social_links: Json | null
          role: string | null
          expertise: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          profile_image?: string | null
          bio?: string | null
          social_links?: Json | null
          role?: string | null
          expertise?: string[] | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['authors']['Insert']>
      }
      articles: {
        Row: {
          id: string
          headline: string
          subtitle: string | null
          slug: string
          content: string
          featured_image: string | null
          gallery_images: string[] | null
          video_url: string | null
          author_id: string | null
          category_id: string | null
          view_count: number
          share_count: number
          comment_count: number
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          status: ArticleStatus
          publish_date: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          headline: string
          subtitle?: string | null
          slug: string
          content?: string
          featured_image?: string | null
          gallery_images?: string[] | null
          video_url?: string | null
          author_id?: string | null
          category_id?: string | null
          view_count?: number
          share_count?: number
          comment_count?: number
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          status?: ArticleStatus
          publish_date?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['articles']['Insert']>
      }
      tags: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
      }
      article_tags: {
        Row: { article_id: string; tag_id: string }
        Insert: { article_id: string; tag_id: string }
        Update: Partial<Database['public']['Tables']['article_tags']['Insert']>
      }
      article_views: {
        Row: {
          id: string
          article_id: string
          viewed_at: string
          country: string | null
          city: string | null
          device_type: string | null
          source: string | null
          reading_time_seconds: number | null
        }
        Insert: {
          id?: string
          article_id: string
          viewed_at?: string
          country?: string | null
          city?: string | null
          device_type?: string | null
          source?: string | null
          reading_time_seconds?: number | null
        }
        Update: Partial<Database['public']['Tables']['article_views']['Insert']>
      }
      comments: {
        Row: {
          id: string
          article_id: string
          parent_id: string | null
          author_name: string
          author_email: string | null
          body: string
          status: CommentStatus
          likes: number
          reports: number
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          parent_id?: string | null
          author_name: string
          author_email?: string | null
          body: string
          status?: CommentStatus
          likes?: number
          reports?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      comment_likes: {
        Row: { id: string; comment_id: string; fingerprint: string; created_at: string }
        Insert: { id?: string; comment_id: string; fingerprint: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['comment_likes']['Insert']>
      }
      live_updates: {
        Row: {
          id: string
          story_id: string | null
          headline: string
          body: string | null
          status: string
          category_id: string | null
          pinned: boolean
          reader_count: number
          published_at: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          headline: string
          body?: string | null
          status?: string
          category_id?: string | null
          pinned?: boolean
          reader_count?: number
          published_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['live_updates']['Insert']>
      }
      media: {
        Row: {
          id: string
          name: string
          url: string
          type: string
          folder: string | null
          size_bytes: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          type: string
          folder?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['media']['Insert']>
      }
      settings: {
        Row: { key: string; value: Json; updated_at: string }
        Insert: { key: string; value: Json; updated_at?: string }
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
      newsletter_subscribers: {
        Row: { id: string; email: string; created_at: string }
        Insert: { id?: string; email: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>
      }
      ai_generations: {
        Row: {
          id: string
          article_id: string | null
          action: AiActionType
          prompt: string
          response: Json
          approved: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          article_id?: string | null
          action: AiActionType
          prompt: string
          response: Json
          approved?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_generations']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type ArticleRow = Database['public']['Tables']['articles']['Row'] & {
  authors?: Database['public']['Tables']['authors']['Row'] | null
  categories?: Database['public']['Tables']['categories']['Row'] | null
}
