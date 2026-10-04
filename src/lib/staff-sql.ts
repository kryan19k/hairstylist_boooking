// One-time database update for staff schedules. Shown (with a Copy button) in the dashboard when the
// columns/tables are missing, and also appended to the fresh-install schema files.
const S = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";

export const STAFF_SQL = `-- Staff schedules, days off, and per-person double-booking protection
alter table if exists ${S}.team add column if not exists takes_bookings boolean not null default true;
alter table if exists ${S}.team add column if not exists schedule jsonb;
alter table if exists ${S}.team add column if not exists service_ids text[] not null default '{}';
alter table ${S}.bookings add column if not exists member_id text not null default 'owner';

create table if not exists ${S}.time_off (
  id uuid primary key default gen_random_uuid(),
  member_id text not null default 'owner',
  start_date date not null,
  end_date date not null,
  reason text not null default '',
  sort int not null default 0,
  active boolean not null default true,
  check (end_date >= start_date)
);
alter table ${S}.time_off enable row level security;
drop policy if exists "admin all" on ${S}.time_off;
create policy "admin all" on ${S}.time_off for all to authenticated using (${S}.is_admin()) with check (${S}.is_admin());

-- visitors learn WHO is off and WHEN, never why
create or replace function ${S}.time_off_public(from_date date, to_date date)
returns table (member_id text, start_date date, end_date date)
language sql security definer stable set search_path = ${S} as $$
  select t.member_id, t.start_date, t.end_date from ${S}.time_off t
  where t.active and t.end_date >= from_date and t.start_date <= to_date;
$$;
grant execute on function ${S}.time_off_public(date, date) to anon, authenticated;

-- busy times now say whose chair
drop function if exists ${S}.busy_slots(date, date);
create function ${S}.busy_slots(from_date date, to_date date)
returns table (date date, "time" text, minutes int, member_id text)
language sql security definer stable set search_path = ${S} as $$
  select b.date, b.time, b.minutes, b.member_id from ${S}.bookings b
  where b.status <> 'cancelled' and b.date between from_date and to_date;
$$;
grant execute on function ${S}.busy_slots(date, date) to anon, authenticated;

-- two people can share a start time; one person cannot be double-booked
drop index if exists ${S}.bookings_slot_unique;
create unique index if not exists bookings_slot_unique on ${S}.bookings (date, time, member_id) where status <> 'cancelled';

create or replace function ${S}.prevent_booking_overlap() returns trigger
language plpgsql security definer set search_path = ${S} as $$
begin
  if new.status <> 'cancelled' and exists (
    select 1 from ${S}.bookings b
    where b.id <> new.id and b.status <> 'cancelled' and b.date = new.date and b.member_id = new.member_id
      and (b.time::time, b.time::time + make_interval(mins => b.minutes))
          overlaps (new.time::time, new.time::time + make_interval(mins => new.minutes))
  ) then
    raise exception 'That time overlaps another appointment' using errcode = '23505';
  end if;
  return new;
end $$;
drop trigger if exists bookings_no_overlap on ${S}.bookings;
create trigger bookings_no_overlap
  before insert or update of date, time, minutes, status, member_id on ${S}.bookings
  for each row execute function ${S}.prevent_booking_overlap();

notify pgrst, 'reload schema';`;
