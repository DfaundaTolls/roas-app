-- supabase/migrations/001_init.sql
-- DB untuk flow: register -> pending approve -> admin approve -> user bisa akses app

-- 1) profiles: status approval + role
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2) roas_runs: optional simpan history kalkulasi (kalau mau)
create table if not exists public.roas_runs (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.roas_runs enable row level security;

-- 3) Trigger: setiap user auth baru => auto insert ke profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, approved, role)
  values (new.id, new.email, false, 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4) RLS policies

-- profiles: user boleh baca profile dirinya sendiri
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

-- profiles: user boleh update field non-sensitif miliknya sendiri (optional)
-- NOTE: untuk simpel, kita lock update hanya email sink (tanpa metadata lain)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- roas_runs: user boleh CRUD punya dia sendiri
drop policy if exists "roas_runs_select_own" on public.roas_runs;
create policy "roas_runs_select_own"
on public.roas_runs for select
using (auth.uid() = user_id);

drop policy if exists "roas_runs_insert_own" on public.roas_runs;
create policy "roas_runs_insert_own"
on public.roas_runs for insert
with check (auth.uid() = user_id);

drop policy if exists "roas_runs_delete_own" on public.roas_runs;
create policy "roas_runs_delete_own"
on public.roas_runs for delete
using (auth.uid() = user_id);

-- 5) Helper view: pending users (admin only via service role / edge function)
create or replace view public.pending_users as
select id, email, created_at
from public.profiles
where approved = false;
