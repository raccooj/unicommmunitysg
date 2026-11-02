-- Campus SG: profiles, posts, comments with Row Level Security.
-- Repeatable: safe to run more than once in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  university text check (university in ('NUS', 'NTU', 'SMU', 'SIM')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  university text not null check (university in ('NUS', 'NTU', 'SMU', 'SIM')),
  category text not null check (category in ('general', 'academics', 'campus_life')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  is_op boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_university_created_idx
  on public.posts (university, created_at desc);
create index if not exists posts_university_category_created_idx
  on public.posts (university, category, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at);
create index if not exists comments_author_idx on public.comments (author_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Current user's university. SECURITY DEFINER so policies can call it
-- without recursing through profiles RLS.
create or replace function public.current_university()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select university from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_university() from public, anon;
grant execute on function public.current_university() to authenticated;

-- Create an empty profile for each new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- University is chosen once; it cannot be switched afterwards (prevents
-- hopping between universities to read other feeds).
create or replace function public.lock_university()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.university is not null and new.university is distinct from old.university then
    raise exception 'University cannot be changed once selected';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_university on public.profiles;
create trigger profiles_lock_university
  before update on public.profiles
  for each row execute function public.lock_university();

-- Force server-controlled fields on new posts.
create or replace function public.prepare_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.author_id := auth.uid();
  new.university := (select university from public.profiles where id = auth.uid());
  new.comment_count := 0;
  new.created_at := now();
  if new.university is null then
    raise exception 'Select a university before posting';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_prepare on public.posts;
create trigger posts_prepare
  before insert on public.posts
  for each row execute function public.prepare_post();

-- Force server-controlled fields on new comments; mark the original poster.
create or replace function public.prepare_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.author_id := auth.uid();
  new.created_at := now();
  new.is_op := exists (
    select 1 from public.posts p where p.id = new.post_id and p.author_id = auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists comments_prepare on public.comments;
create trigger comments_prepare
  before insert on public.comments
  for each row execute function public.prepare_comment();

-- Keep posts.comment_count in sync.
create or replace function public.sync_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_count on public.comments;
create trigger comments_count
  after insert or delete on public.comments
  for each row execute function public.sync_comment_count();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prepare_post() from public, anon, authenticated;
revoke all on function public.prepare_comment() from public, anon, authenticated;
revoke all on function public.sync_comment_count() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privileges: column-level grants keep author_id unreadable by clients.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.posts, public.comments from anon, authenticated;

grant select (id, university, created_at) on public.profiles to authenticated;
grant update (university) on public.profiles to authenticated;

grant select (id, university, category, title, body, comment_count, created_at)
  on public.posts to authenticated;
grant insert (category, title, body) on public.posts to authenticated;
grant update (category, title, body) on public.posts to authenticated;
grant delete on public.posts to authenticated;

grant select (id, post_id, is_op, body, created_at) on public.comments to authenticated;
grant insert (post_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "posts_select_same_university" on public.posts;
create policy "posts_select_same_university" on public.posts
  for select to authenticated
  using (university = (select public.current_university()));

drop policy if exists "posts_insert_own_university" on public.posts;
create policy "posts_insert_own_university" on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and university = (select public.current_university())
  );

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "comments_select_same_university" on public.comments;
create policy "comments_select_same_university" on public.comments
  for select to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and p.university = (select public.current_university())
  ));

drop policy if exists "comments_insert_accessible_post" on public.comments;
create policy "comments_insert_accessible_post" on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.university = (select public.current_university())
    )
  );

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete to authenticated
  using (author_id = (select auth.uid()));

-- Backfill profiles for users created before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
