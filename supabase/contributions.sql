-- I.A.M. Living Material Library: "Contribute to the Lab" with moderation.
-- Run once in Supabase: SQL Editor > New query > paste this file > Run. Safe to run again.
--
-- How it works
--   * A visitor's translation lives privately in their own browser (My Collection).
--   * Only if they tick the consent box and submit, a row arrives here with status 'pending_review'.
--     Pending rows are NOT readable by anyone through the website.
--   * To publish: Table Editor > library_contributions > set status to 'published' (reviewed_at fills itself).
--     To decline: set status to 'rejected' (or delete the row).
--   * The visitor can withdraw at any time from My Collection; this deletes the row.
--     Their browser holds a secret withdraw_token; the token column is never readable by the public.

create table if not exists public.library_contributions (
  id uuid primary key,
  material_key text not null check (material_key ~ '^[0-9]{3}$'),
  object_no text check (object_no is null or object_no ~ '^[0-9]{3}$'),
  action text check (action is null or char_length(action) <= 40),
  text text not null check (char_length(text) between 1 and 1000),
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  personal_id text check (personal_id is null or char_length(personal_id) <= 20),
  consent boolean not null check (consent),
  status text not null default 'pending_review' check (status in ('pending_review', 'published', 'rejected')),
  withdraw_token text not null check (char_length(withdraw_token) between 24 and 80),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists library_contributions_material on public.library_contributions (material_key, status, created_at);

alter table public.library_contributions enable row level security;

-- the public may only read approved rows
drop policy if exists "read published contributions" on public.library_contributions;
create policy "read published contributions" on public.library_contributions
  for select to anon, authenticated using (status = 'published');

-- anyone may submit, but only as pending and only with consent
drop policy if exists "submit contributions" on public.library_contributions;
create policy "submit contributions" on public.library_contributions
  for insert to anon, authenticated with check (status = 'pending_review' and consent = true and reviewed_at is null);

-- column level grants: the token and personal id are never readable through the API
revoke all on public.library_contributions from anon, authenticated;
grant select (id, material_key, object_no, action, text, display_name, status, created_at, reviewed_at)
  on public.library_contributions to anon, authenticated;
grant insert (id, material_key, object_no, action, text, display_name, personal_id, consent, withdraw_token)
  on public.library_contributions to anon, authenticated;

-- stamp reviewed_at when Lynn changes the status
create or replace function public.library_contributions_reviewed() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then new.reviewed_at := now(); end if;
  return new;
end $$;
drop trigger if exists library_contributions_reviewed on public.library_contributions;
create trigger library_contributions_reviewed before update on public.library_contributions
  for each row execute function public.library_contributions_reviewed();

-- withdrawal: only the browser that submitted (holding the token) can remove its row
create or replace function public.withdraw_contribution(p_id uuid, p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.library_contributions where id = p_id and withdraw_token = p_token;
  return found;
end $$;
revoke all on function public.withdraw_contribution(uuid, text) from public;
grant execute on function public.withdraw_contribution(uuid, text) to anon, authenticated;
