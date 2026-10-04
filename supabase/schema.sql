-- Ella El Beauty Salon — database schema.
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.

------------------------------------------------------------------
-- Admin identity
------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- The first signed-in user can claim ownership; after that it returns false.
create or replace function public.claim_admin() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.admins) then return false; end if;
  insert into public.admins (user_id) values (auth.uid());
  return true;
end $$;
revoke all on function public.claim_admin() from public, anon;
grant execute on function public.claim_admin() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

------------------------------------------------------------------
-- Content tables
------------------------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);
insert into public.site_settings (id) values (1) on conflict do nothing;

create table if not exists public.services (
  id text primary key,
  name text not null,
  category text not null default 'Color',
  blurb text not null default '',
  price numeric not null default 0,
  minutes int not null default 60,
  deposit numeric not null default 0,
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.addons (
  id text primary key,
  name text not null,
  blurb text not null default '',
  price numeric not null default 0,
  minutes int not null default 15,
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.looks (
  id text primary key,
  title text not null,
  category text not null default 'Color',
  kind text not null default 'straight',
  palette text[] not null default '{#3a2418,#b98a5e,#f1dcc0}',
  service_id text,
  story text not null default '',
  hours text not null default '',
  seed int not null default 1,
  image_url text,
  before_url text,
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null default '',
  quote text not null,
  stars int not null default 5 check (stars between 1 and 5),
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  q text not null,
  a text not null,
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  bio text not null default '',
  photo_url text,
  instagram text not null default '',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  service_id text not null,
  service_name text not null,
  addon_ids text[] not null default '{}',
  date date not null,
  time text not null,
  minutes int not null,
  total numeric not null default 0,
  deposit numeric not null default 0,
  name text not null,
  email text not null,
  phone text not null,
  first_visit boolean not null default true,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now()
);
-- Hard stop against two clients grabbing the exact same start time.
create unique index if not exists bookings_slot_unique on public.bookings (date, time) where status <> 'cancelled';

------------------------------------------------------------------
-- Row level security
------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['services','addons','looks','reviews','faqs','team'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (active or public.is_admin())', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.site_settings enable row level security;
drop policy if exists "public read" on public.site_settings;
create policy "public read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admin write" on public.site_settings;
create policy "admin write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.bookings enable row level security;
drop policy if exists "anyone can request" on public.bookings;
create policy "anyone can request" on public.bookings for insert to anon, authenticated
  with check (status = 'pending' and char_length(name) between 2 and 80 and char_length(notes) <= 1000);
drop policy if exists "admin manage" on public.bookings;
create policy "admin manage" on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Visitors can see WHICH times are busy, never WHO booked them.
create or replace function public.busy_slots(from_date date, to_date date)
returns table (date date, "time" text, minutes int)
language sql security definer stable set search_path = public as $$
  select b.date, b.time, b.minutes from public.bookings b
  where b.status <> 'cancelled' and b.date between from_date and to_date;
$$;
grant execute on function public.busy_slots(date, date) to anon, authenticated;

------------------------------------------------------------------
-- Image storage (portrait, portfolio photos)
------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and public.is_admin());
