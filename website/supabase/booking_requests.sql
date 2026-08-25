-- Booking requests from the public site.
--
-- The website posts here with the publishable (anon) key, which ships in the
-- JS bundle and must be assumed public. The security of this table therefore
-- rests entirely on the policies below: anon may INSERT and may do nothing
-- else. There is deliberately NO anon SELECT policy — with one, anyone could
-- read every client's name, phone and notes straight from the browser.
--
-- Read submissions in the Supabase dashboard (Table Editor -> booking_requests)
-- or with the service_role key from a trusted server. Never from the site.

create table if not exists public.booking_requests (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),

  name           text not null,
  phone          text not null,
  email          text,
  style          text not null,
  preferred_date date not null,
  preferred_time text,
  notes          text,

  -- Salon-side workflow. Only reachable with the service_role key or from the
  -- dashboard; the site never sets or reads it.
  status         text not null default 'new',

  -- Length caps are enforced here as well as in the browser. Client-side
  -- maxlength is a convenience for real visitors and no obstacle to anyone
  -- posting to the endpoint directly.
  constraint booking_requests_name_len    check (char_length(name)  between 2 and 80),
  constraint booking_requests_phone_len   check (char_length(phone) between 7 and 30),
  constraint booking_requests_email_len   check (email is null or char_length(email) <= 120),
  constraint booking_requests_style_len   check (char_length(style) <= 80),
  constraint booking_requests_notes_len   check (notes is null or char_length(notes) <= 600),
  constraint booking_requests_status_vals check (status in ('new','confirmed','declined','done'))
);

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

create index if not exists booking_requests_status_idx
  on public.booking_requests (status)
  where status = 'new';

alter table public.booking_requests enable row level security;

-- Anonymous visitors may file a request. That is the whole of their access.
drop policy if exists "anon can file a booking request" on public.booking_requests;
create policy "anon can file a booking request"
  on public.booking_requests
  for insert
  to anon
  with check (true);

-- No select/update/delete policy for anon or authenticated is intentional.
-- RLS denies by default, so omitting them is what keeps the table private.
