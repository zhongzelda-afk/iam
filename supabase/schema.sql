-- I.A.M. shared archive: paste into Supabase > SQL Editor > New query > Run.
-- Safe to run again: it only adds what is missing.

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  material_id text not null check (material_id ~ '^([0-9]{3}([.][0-9]{2})?|c-[a-z0-9]{8})$'),
  alias text check (char_length(alias) <= 40),
  observe jsonb not null default '{}'::jsonb,
  meaning text not null check (char_length(meaning) between 1 and 80),
  meaning_note text check (char_length(meaning_note) <= 400),
  voice text check (char_length(voice) <= 200),
  body jsonb check (body is null or pg_column_size(body) < 20000),
  own_body_note text check (char_length(own_body_note) <= 400),
  revisions jsonb not null default '[]'::jsonb check (pg_column_size(revisions) < 20000)
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200)
);

-- community materials added from the Archive
create table if not exists public.materials (
  id text primary key check (id ~ '^c-[a-z0-9]{8}$'),
  owner uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 40),
  note text check (char_length(note) <= 160)
);

-- entries may point at community materials too (updates tables made by an earlier version of this file)
alter table public.entries drop constraint if exists entries_material_id_check;
alter table public.entries add constraint entries_material_id_check check (material_id ~ '^([0-9]{3}([.][0-9]{2})?|c-[a-z0-9]{8})$');

create index if not exists entries_material_idx on public.entries (material_id, created_at desc);
create index if not exists readings_entry_idx on public.readings (entry_id);

alter table public.entries enable row level security;
alter table public.readings enable row level security;
alter table public.materials enable row level security;

-- everyone can read the collective
drop policy if exists "read entries" on public.entries;
create policy "read entries" on public.entries for select using (true);
drop policy if exists "read readings" on public.readings;
create policy "read readings" on public.readings for select using (true);
drop policy if exists "read materials" on public.materials;
create policy "read materials" on public.materials for select using (true);

-- visitors (anonymous sign-in) add, revise and withdraw only their own entries
drop policy if exists "insert own entries" on public.entries;
create policy "insert own entries" on public.entries for insert to authenticated with check (owner = auth.uid());
drop policy if exists "update own entries" on public.entries;
create policy "update own entries" on public.entries for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "delete own entries" on public.entries;
create policy "delete own entries" on public.entries for delete to authenticated using (owner = auth.uid());

drop policy if exists "insert own readings" on public.readings;
create policy "insert own readings" on public.readings for insert to authenticated with check (owner = auth.uid());

drop policy if exists "insert own materials" on public.materials;
create policy "insert own materials" on public.materials for insert to authenticated with check (owner = auth.uid());
drop policy if exists "delete own materials" on public.materials;
create policy "delete own materials" on public.materials for delete to authenticated using (owner = auth.uid());
