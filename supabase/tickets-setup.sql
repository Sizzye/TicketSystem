create extension if not exists "pgcrypto";

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text not null default '',
  status text not null default 'checked-in',
  password text not null default '',
  device text not null,
  issue text not null default '',
  check_in_date text not null,
  accessories text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;

create trigger tickets_set_updated_at
before update on public.tickets
for each row
execute function public.set_ticket_updated_at();

alter table public.tickets enable row level security;

drop policy if exists "Allow public read tickets" on public.tickets;
create policy "Allow public read tickets"
on public.tickets
for select
to anon, authenticated
using (true);

drop policy if exists "Allow public insert tickets" on public.tickets;
create policy "Allow public insert tickets"
on public.tickets
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public update tickets" on public.tickets;
create policy "Allow public update tickets"
on public.tickets
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public delete tickets" on public.tickets;
create policy "Allow public delete tickets"
on public.tickets
for delete
to anon, authenticated
using (true);
