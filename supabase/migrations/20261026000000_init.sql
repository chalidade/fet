-- fet: skema awal platform belajar komunitas.
-- Jalankan di Supabase: SQL Editor → paste file ini → Run (atau `supabase db push`).

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  display_name text not null default ''
    check (char_length(display_name) <= 60),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  bio text not null default '' check (char_length(bio) <= 280),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public"
  on public.profiles for select using (true);

create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Buat profil otomatis saat user pertama kali login (GitHub / Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(coalesce(meta ->> 'user_name', meta ->> 'preferred_username', split_part(new.email, '@', 1), 'user'));
  base := regexp_replace(base, '[^a-z0-9_-]', '', 'g');
  base := regexp_replace(base, '^[^a-z0-9]+', '');
  if char_length(base) < 3 then
    base := base || 'user';
  end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(meta ->> 'full_name', meta ->> 'name', candidate), 60),
    case when meta ->> 'avatar_url' like 'https://%' then meta ->> 'avatar_url' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Progres per tahap (publik: hanya status) dan hasil kerja (privat)
-- ---------------------------------------------------------------------------
create table public.stage_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  stage text not null check (stage ~ '^[0-9]{2}-[a-z0-9-]+$'),
  status text not null default 'in-progress'
    check (status in ('not-started', 'in-progress', 'done')),
  updated_at timestamptz not null default now(),
  primary key (user_id, stage)
);

alter table public.stage_progress enable row level security;

create policy "progress is public"
  on public.stage_progress for select using (true);
create policy "users insert their own progress"
  on public.stage_progress for insert with check (auth.uid() = user_id);
create policy "users update their own progress"
  on public.stage_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete their own progress"
  on public.stage_progress for delete using (auth.uid() = user_id);

create table public.stage_work (
  user_id uuid not null references public.profiles (id) on delete cascade,
  stage text not null check (stage ~ '^[0-9]{2}-[a-z0-9-]+$'),
  notes text not null default '' check (char_length(notes) <= 100000),
  code jsonb not null default '{}'::jsonb check (pg_column_size(code) <= 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, stage)
);

alter table public.stage_work enable row level security;

create policy "users read their own work"
  on public.stage_work for select using (auth.uid() = user_id);
create policy "users insert their own work"
  on public.stage_work for insert with check (auth.uid() = user_id);
create policy "users update their own work"
  on public.stage_work for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete their own work"
  on public.stage_work for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Komunitas: postingan, komentar, reaksi
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stage text not null check (stage ~ '^[0-9]{2}-[a-z0-9-]+$'),
  title text not null check (char_length(title) between 3 and 120),
  body text not null default '' check (char_length(body) <= 20000),
  video_url text check (video_url is null or video_url ~ '^https://'),
  code jsonb check (code is null or pg_column_size(code) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_stage_idx on public.posts (stage, created_at desc);
create index posts_user_idx on public.posts (user_id, created_at desc);

alter table public.posts enable row level security;

create policy "posts are public"
  on public.posts for select using (true);
create policy "users create their own posts"
  on public.posts for insert with check (auth.uid() = user_id);
create policy "users update their own posts"
  on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete their own posts"
  on public.posts for delete using (auth.uid() = user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "comments are public"
  on public.comments for select using (true);
create policy "users create their own comments"
  on public.comments for insert with check (auth.uid() = user_id);
create policy "users delete their own comments"
  on public.comments for delete using (auth.uid() = user_id);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.reactions enable row level security;

create policy "reactions are public"
  on public.reactions for select using (true);
create policy "users add their own reactions"
  on public.reactions for insert with check (auth.uid() = user_id);
create policy "users remove their own reactions"
  on public.reactions for delete using (auth.uid() = user_id);

-- updated_at otomatis
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger stage_progress_touch before update on public.stage_progress
  for each row execute function public.touch_updated_at();
create trigger stage_work_touch before update on public.stage_work
  for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Views (security_invoker: tetap mengikuti RLS pemanggil)
-- ---------------------------------------------------------------------------
create view public.posts_feed with (security_invoker = true) as
select
  p.id, p.user_id, p.stage, p.title, p.body, p.video_url, p.code, p.created_at, p.updated_at,
  pr.username, pr.display_name, pr.avatar_url,
  (select count(*) from public.reactions r where r.post_id = p.id)::int as reaction_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count
from public.posts p
join public.profiles pr on pr.id = p.user_id;

create view public.stage_stats with (security_invoker = true) as
select
  stage,
  count(*) filter (where status = 'in-progress')::int as learning,
  count(*) filter (where status = 'done')::int as done
from public.stage_progress
group by stage;

grant select on public.posts_feed, public.stage_stats to anon, authenticated;
