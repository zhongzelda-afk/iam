-- The Library of Found Materials: readings without accounts.
-- Run once in Supabase: SQL Editor > New query > paste this file > Run. Safe to run again.
-- Anyone can read readings and add one. Nobody can edit or delete through the website;
-- Lynn removes unwanted readings in Table Editor > library_readings.

create table if not exists public.library_readings (
  id uuid primary key default gen_random_uuid(),
  material_id text not null check (material_id ~ '^[0-9]{3}$'),
  text text not null check (char_length(text) between 1 and 280),
  name text check (name is null or char_length(name) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists library_readings_material on public.library_readings (material_id, created_at desc);

alter table public.library_readings enable row level security;

drop policy if exists "read library readings" on public.library_readings;
create policy "read library readings" on public.library_readings for select using (true);

drop policy if exists "add library readings" on public.library_readings;
create policy "add library readings" on public.library_readings for insert to anon, authenticated
  with check (char_length(text) between 1 and 280 and (name is null or char_length(name) <= 40));

grant select, insert on public.library_readings to anon, authenticated;
