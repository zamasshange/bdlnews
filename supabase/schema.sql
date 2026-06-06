create extension if not exists "pgcrypto";

create type public.user_role as enum ('super_admin', 'admin', 'editor', 'journalist');
create type public.article_status as enum ('draft', 'review', 'scheduled', 'published', 'archived', 'breaking');
create type public.comment_status as enum ('pending', 'approved', 'hidden', 'spam');
create type public.ai_action_type as enum ('generate_headline', 'improve_headline', 'summarize_article', 'explain_like_15', 'generate_seo_description', 'generate_tags');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'journalist',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profile_image text,
  bio text,
  social_links jsonb default '{}'::jsonb,
  role text,
  expertise text[] default '{}',
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  subtitle text,
  slug text not null unique,
  content text not null default '',
  featured_image text,
  gallery_images text[] default '{}',
  video_url text,
  author_id uuid references public.authors(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  view_count bigint not null default 0,
  share_count bigint not null default 0,
  comment_count bigint not null default 0,
  seo_title text,
  seo_description text,
  seo_keywords text[] default '{}',
  status public.article_status not null default 'draft',
  publish_date timestamptz,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create table public.article_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  country text,
  city text,
  device_type text,
  source text,
  reading_time_seconds integer
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_name text not null,
  author_email text,
  body text not null,
  status public.comment_status not null default 'pending',
  likes integer not null default 0,
  reports integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, fingerprint)
);

create table public.live_updates (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.articles(id) on delete cascade,
  headline text not null,
  body text,
  status text not null default 'live',
  category_id uuid references public.categories(id) on delete set null,
  pinned boolean not null default false,
  reader_count integer not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text not null,
  folder text,
  size_bytes bigint,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  action public.ai_action_type not null,
  prompt text not null,
  response jsonb not null,
  approved boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

create index articles_status_publish_idx on public.articles(status, publish_date desc);
create index articles_slug_idx on public.articles(slug);
create index articles_category_idx on public.articles(category_id);
create index articles_search_idx on public.articles using gin (
  to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(content, '') || ' ' || array_to_string(coalesce(seo_keywords, '{}'), ' '))
);
create index article_views_article_time_idx on public.article_views(article_id, viewed_at desc);
create index article_views_time_idx on public.article_views(viewed_at desc);
create index comments_status_idx on public.comments(status);
create index comments_article_idx on public.comments(article_id, created_at desc);
create index live_updates_time_idx on public.live_updates(pinned desc, published_at desc);
create index media_type_folder_idx on public.media(type, folder);

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.articles enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_views enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.live_updates enable row level security;
alter table public.media enable row level security;
alter table public.settings enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.ai_generations enable row level security;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.ensure_article_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  if new.slug is null or length(trim(new.slug)) = 0 then
    base_slug := public.slugify(new.headline);
  else
    base_slug := public.slugify(new.slug);
  end if;

  if length(base_slug) = 0 then
    base_slug := 'story';
  end if;

  candidate := base_slug;
  while exists (
    select 1 from public.articles
    where slug = candidate and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate;
  if new.status in ('published', 'breaking') and new.publish_date is null then
    new.publish_date := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger ensure_article_slug_before_write
before insert or update on public.articles
for each row execute function public.ensure_article_slug();

create or replace function public.increment_article_view(target_article uuid)
returns void
language sql
security definer
as $$
  update public.articles set view_count = view_count + 1, updated_at = now() where id = target_article;
$$;

create or replace function public.refresh_article_comment_count()
returns trigger
language plpgsql
as $$
declare
  target uuid;
begin
  target := coalesce(new.article_id, old.article_id);
  update public.articles
  set comment_count = (
    select count(*) from public.comments
    where article_id = target and status = 'approved'
  )
  where id = target;
  return coalesce(new, old);
end;
$$;

create trigger refresh_article_comment_count_after_write
after insert or update or delete on public.comments
for each row execute function public.refresh_article_comment_count();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() in ('super_admin', 'admin', 'editor', 'journalist'), false)
$$;

create policy "published articles are public" on public.articles
  for select using (status in ('published', 'breaking') and (publish_date is null or publish_date <= now()));

create policy "public categories" on public.categories for select using (true);
create policy "public authors" on public.authors for select using (true);
create policy "public tags" on public.tags for select using (true);
create policy "public live updates" on public.live_updates for select using (true);
create policy "approved comments are public" on public.comments for select using (status = 'approved');

create policy "admin read all users" on public.users for select using (public.is_admin_user());
create policy "admin manage users" on public.users for all using (public.current_user_role() in ('super_admin', 'admin')) with check (public.current_user_role() in ('super_admin', 'admin'));

create policy "admin manage categories" on public.categories for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage authors" on public.authors for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage articles" on public.articles for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage tags" on public.tags for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage article tags" on public.article_tags for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin read views" on public.article_views for select using (public.is_admin_user());
create policy "public insert views" on public.article_views for insert with check (true);
create policy "admin manage comments" on public.comments for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "public insert comments" on public.comments for insert with check (true);
create policy "public insert comment likes" on public.comment_likes for insert with check (true);
create policy "admin manage comment likes" on public.comment_likes for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage live updates" on public.live_updates for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage media" on public.media for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin manage settings" on public.settings for all using (public.current_user_role() in ('super_admin', 'admin')) with check (public.current_user_role() in ('super_admin', 'admin'));
create policy "public insert newsletter subscribers" on public.newsletter_subscribers for insert with check (true);
create policy "admin read newsletter subscribers" on public.newsletter_subscribers for select using (public.is_admin_user());
create policy "admin manage ai generations" on public.ai_generations for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "public read media bucket" on storage.objects for select using (bucket_id = 'bdl-media');
create policy "admin manage media bucket" on storage.objects for all using (bucket_id = 'bdl-media' and public.is_admin_user()) with check (bucket_id = 'bdl-media' and public.is_admin_user());

insert into public.categories (name, slug) values
  ('World', 'world'),
  ('Politics', 'politics'),
  ('Business', 'business'),
  ('Technology', 'technology'),
  ('Sports', 'sports'),
  ('Entertainment', 'entertainment'),
  ('Africa', 'africa'),
  ('Opinion', 'opinion'),
  ('AI News', 'ai-news'),
  ('Science', 'science'),
  ('Health', 'health')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('bdl-media', 'bdl-media', true)
on conflict (id) do nothing;

alter publication supabase_realtime add table public.articles;
alter publication supabase_realtime add table public.live_updates;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.article_views;
alter publication supabase_realtime add table public.comment_likes;
