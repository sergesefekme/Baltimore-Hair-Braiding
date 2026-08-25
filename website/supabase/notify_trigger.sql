-- Fires the notify-booking Edge Function whenever a booking request lands.
-- APPLIED to project mirabelle-b-booking (dqglhppksyhekaflnyop) on 2026-08-25.
--
-- This is the code equivalent of a Supabase Database Webhook, written as SQL
-- so it lives in the repo instead of only in a dashboard form. The body it
-- posts deliberately matches Supabase's webhook envelope, so swapping to a
-- dashboard webhook later needs no change in the function.

-- pg_net gives Postgres an async HTTP client. Async is the point: the booking
-- row commits whether or not the email succeeds, so a Resend outage can never
-- cost a booking. The flip side is that failures are silent at insert time --
-- check net._http_response (see the query at the foot of this file).
create extension if not exists pg_net;

create or replace function public.notify_booking_request()
returns trigger
language plpgsql
security definer
-- Pinned search_path: a SECURITY DEFINER function without one can be steered
-- by a caller-controlled path.
set search_path = public, net, extensions
as $$
begin
  perform net.http_post(
    url := 'https://dqglhppksyhekaflnyop.supabase.co/functions/v1/notify-booking',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- Legacy anon JWT, not the sb_publishable_ key: the function is deployed
      -- with verify_jwt=true and that gate wants a real JWT. This key is
      -- public by design (it already ships in the site bundle), so storing it
      -- here leaks nothing.
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2xocHBrc3loZWthZmxueW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MjAzNDAsImV4cCI6MjEwMzE5NjM0MH0.Z74CRBovVBOgSMgxjAuBIfyJkjVWFajemrsH1hpoSoo'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', tg_table_name,
      'record', to_jsonb(new),
      'old_record', null
    )
  );
  return new;
end;
$$;

-- A trigger function has no business being reachable over the REST API.
-- PostgREST exposes anything executable in `public` at /rest/v1/rpc/<name>,
-- and this one is SECURITY DEFINER. Calling a trigger function directly
-- errors out, but "it errors out" is not access control. Triggers ignore
-- EXECUTE grants, so revoking costs the feature nothing.
revoke all on function public.notify_booking_request() from public;
revoke all on function public.notify_booking_request() from anon;
revoke all on function public.notify_booking_request() from authenticated;

drop trigger if exists booking_requests_notify on public.booking_requests;
create trigger booking_requests_notify
  after insert on public.booking_requests
  for each row
  execute function public.notify_booking_request();


-- ---------------------------------------------------------------------------
-- Diagnosing "the booking saved but no email arrived"
-- ---------------------------------------------------------------------------
--   select status_code, left(content, 300), created
--   from net._http_response order by created desc limit 10;
--
--   200  "ok"              -- sent; if it is not in the inbox, check spam
--   500  "Not configured"  -- RESEND_API_KEY secret is missing
--   401 / 403              -- the anon JWT above no longer matches the project
--   502  "Resend 403 ..."  -- itworldteks.com is no longer verified at Resend
--
-- Known advisory, not a defect: the linter reports pg_net as "installed in the
-- public schema". pg_net does not support ALTER EXTENSION ... SET SCHEMA, and
-- it places zero tables and zero functions in public (verified) -- everything
-- callable lives in `net`. The registration namespace is all that is flagged.
