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

-- a submission may be a variety of an existing material (e.g. Blood Orange under 004 Orange)
alter table public.materials add column if not exists parent text check (parent is null or parent ~ '^([0-9]{3}|c-[a-z0-9]{8})$');

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

-- contributors add, revise and withdraw only their own public entries
drop policy if exists "insert own entries" on public.entries;
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

-- ===================== contributor accounts =====================
-- Uses Supabase Auth (email + password, email verification). No passwords are stored by this site.
-- Account, research consent and public sharing are kept as separate concepts.

-- one profile per account: only consent records, no other personal data
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  terms_accepted_at timestamptz,
  privacy_ack_at timestamptz,
  research_consent boolean not null default false,
  research_consent_at timestamptz,
  publish_consent boolean not null default false,
  publish_consent_at timestamptz
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

-- the consent choices made on the sign-up form arrive as user metadata; copy them into the profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, terms_accepted_at, privacy_ack_at, research_consent, research_consent_at, publish_consent, publish_consent_at)
  values (new.id,
    nullif(m->>'terms_at', '')::timestamptz,
    nullif(m->>'privacy_at', '')::timestamptz,
    coalesce((m->>'research_consent')::boolean, false),
    case when coalesce((m->>'research_consent')::boolean, false) then now() end,
    coalesce((m->>'publish_consent')::boolean, false),
    case when coalesce((m->>'publish_consent')::boolean, false) then now() end)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- the private collection: each row is visible only to its owner
create table if not exists public.collection (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  material_id text not null check (material_id ~ '^([0-9]{3}([.][0-9]{2})?|c-[a-z0-9]{8})$'),
  alias text check (char_length(alias) <= 40),
  observe jsonb not null default '{}'::jsonb,
  meaning text not null check (char_length(meaning) between 1 and 80),
  meaning_note text check (char_length(meaning_note) <= 400),
  voice text check (char_length(voice) <= 200),
  body jsonb check (body is null or pg_column_size(body) < 20000),
  own_body_note text check (char_length(own_body_note) <= 400),
  revisions jsonb not null default '[]'::jsonb check (pg_column_size(revisions) < 20000),
  shared boolean not null default false,
  remote_id uuid
);
create index if not exists collection_owner_idx on public.collection (owner, created_at desc);
alter table public.collection enable row level security;
drop policy if exists "own collection select" on public.collection;
create policy "own collection select" on public.collection for select to authenticated using (owner = auth.uid());
drop policy if exists "own collection insert" on public.collection;
create policy "own collection insert" on public.collection for insert to authenticated with check (owner = auth.uid());
drop policy if exists "own collection update" on public.collection;
create policy "own collection update" on public.collection for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "own collection delete" on public.collection;
create policy "own collection delete" on public.collection for delete to authenticated using (owner = auth.uid());

-- a public entry can only be created by a contributor who has given publishing consent
create policy "insert own entries" on public.entries for insert to authenticated
  with check (owner = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.publish_consent));

-- delete my account: removes public entries, guesses, submitted materials, the collection and the profile, then the login itself
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.readings where owner = me;
  delete from public.entries where owner = me;
  delete from public.materials where owner = me;
  delete from public.collection where owner = me;
  delete from public.profiles where id = me;
  delete from auth.users where id = me;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
