-- GOP Blog initial schema
-- Creates: profiles, sources, topics, posts, categories, tags, post_tags,
-- citations, pipeline_runs, prompts, review_queue
-- RLS: public can read published posts + their citations/categories/tags.
--      All writes and admin tables require profiles.role='admin'.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  role text not null default 'reader' check (role in ('reader','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'reader')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories / tags ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- sources ----------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text not null,
  feed_url text,
  source_type text not null default 'rss' check (source_type in ('rss','sitemap','scrape')),
  domain_authority int not null default 50,
  trust_tier int not null check (trust_tier in (1,2,3)),
  topic_cluster text,  -- e.g. 'ivf', 'adoption', 'pcos'
  is_active boolean not null default true,
  last_crawled_at timestamptz,
  crawl_notes text,
  created_at timestamptz not null default now()
);

create index if not exists sources_active_idx on public.sources(is_active, trust_tier);

-- ---------- topics ----------
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  suggested_angle text,
  source_refs jsonb not null default '[]'::jsonb, -- [{url,title,source_id}]
  dedupe_hash text,  -- sha256 of canonicalized title+primary source URL
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','drafted')),
  medical_legal_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists topics_dedupe_idx on public.topics(dedupe_hash) where dedupe_hash is not null;
create index if not exists topics_status_idx on public.topics(status, created_at desc);

-- ---------- posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  body_md text not null default '',
  body_html text,
  cover_image_url text,
  excerpt text,
  seo_title text,
  seo_description text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','scored','queued','published','archived','rejected')),
  confidence_score numeric(5,2),
  rubric jsonb,  -- {source_quality, citation_coverage, risk, fact_check, editorial}
  auto_published boolean not null default false,
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null, -- null = AI
  topic_id uuid references public.topics(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_published_idx on public.posts(status, published_at desc);
create index if not exists posts_topic_idx on public.posts(topic_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---------- post_tags ----------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ---------- citations ----------
create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  claim text not null,
  url text not null,
  source_title text,
  source_tier int check (source_tier in (1,2,3)),
  verified boolean not null default false,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists citations_post_idx on public.citations(post_id, position);

-- ---------- pipeline_runs ----------
create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('research','draft','score','publish')),
  input jsonb,
  output jsonb,
  model text,
  prompt_version text,
  tokens_in int,
  tokens_out int,
  cost_cents int,
  duration_ms int,
  status text not null default 'running' check (status in ('running','success','error','skipped')),
  error text,
  post_id uuid references public.posts(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists runs_recent_idx on public.pipeline_runs(created_at desc);
create index if not exists runs_stage_idx on public.pipeline_runs(stage, created_at desc);

-- ---------- prompts ----------
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage text not null check (stage in ('research','draft','score','publish')),
  version text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name, version)
);

-- ---------- review_queue ----------
create table if not exists public.review_queue (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  reason text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  decision text check (decision in ('approved','rejected','edited')),
  notes text,
  created_at timestamptz not null default now()
);

-- ========== RLS ==========
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.tags             enable row level security;
alter table public.sources          enable row level security;
alter table public.topics           enable row level security;
alter table public.posts            enable row level security;
alter table public.post_tags        enable row level security;
alter table public.citations        enable row level security;
alter table public.pipeline_runs    enable row level security;
alter table public.prompts          enable row level security;
alter table public.review_queue     enable row level security;

-- helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: self-read + admin-all
create policy "profiles self read" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles admin write" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- public read of published posts
create policy "posts public read published" on public.posts for select
  using (status = 'published' or public.is_admin());
create policy "posts admin write" on public.posts for all using (public.is_admin()) with check (public.is_admin());

-- categories / tags: public read, admin write
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "tags public read" on public.tags for select using (true);
create policy "tags admin write" on public.tags for all using (public.is_admin()) with check (public.is_admin());

-- post_tags: public read when parent post is published
create policy "post_tags public read" on public.post_tags for select using (
  exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or public.is_admin()))
);
create policy "post_tags admin write" on public.post_tags for all using (public.is_admin()) with check (public.is_admin());

-- citations: public read when parent post is published
create policy "citations public read" on public.citations for select using (
  exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or public.is_admin()))
);
create policy "citations admin write" on public.citations for all using (public.is_admin()) with check (public.is_admin());

-- admin-only tables
create policy "sources admin all" on public.sources for all using (public.is_admin()) with check (public.is_admin());
create policy "topics admin all" on public.topics for all using (public.is_admin()) with check (public.is_admin());
create policy "pipeline_runs admin all" on public.pipeline_runs for all using (public.is_admin()) with check (public.is_admin());
create policy "prompts admin all" on public.prompts for all using (public.is_admin()) with check (public.is_admin());
create policy "review_queue admin all" on public.review_queue for all using (public.is_admin()) with check (public.is_admin());
