-- 003_audio_retention_cleanup.sql
-- DSGVO: Null recording_url on calls older than 30 days.
-- Apply in Supabase SQL Editor after schema.sql / seed.sql.

-- 1. Extension aktivieren (falls verfügbar; auf Free-Tier ggf. manuell im Dashboard)
create extension if not exists pg_cron;

-- Optional metadata column for cleanup audits
alter table public.calls
  add column if not exists updated_at timestamptz;

-- 2. Stored Procedure für den Cleanup
create or replace function public.cleanup_expired_recordings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_count integer;
begin
  update public.calls
  set
    recording_url = null,
    updated_at = now()
  where
    recording_url is not null
    and created_at < (now() - interval '30 days');

  get diagnostics cleaned_count = row_count;

  raise notice 'DSGVO Cleanup: % Audio-Recordings älter als 30 Tage anonymisiert.', cleaned_count;
  return cleaned_count;
end;
$$;

comment on function public.cleanup_expired_recordings() is
  'DSGVO: nulls calls.recording_url older than 30 days.';

-- Compat alias used by earlier OpsFlow revision / parameterized calls
create or replace function public.cleanup_expired_call_recordings(
  retention_days integer default 30
)
returns table (
  cleaned_count integer,
  cutoff timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := now() - make_interval(days => retention_days);
  v_count integer := 0;
begin
  if retention_days < 1 then
    raise exception 'retention_days must be >= 1';
  end if;

  update public.calls
  set
    recording_url = null,
    updated_at = now()
  where recording_url is not null
    and created_at < v_cutoff;

  get diagnostics v_count = row_count;
  return query select v_count, v_cutoff;
end;
$$;

create index if not exists idx_calls_recording_retention
  on public.calls (created_at)
  where recording_url is not null;

-- 3. Täglicher Cron-Job um 03:00 Uhr UTC via pg_cron
-- Bei Fehlern (Extension/Permissions): Vercel Cron Route nutzen.
do $$
begin
  perform cron.schedule(
    'dsgvo-audio-cleanup-daily',
    '0 3 * * *',
    $cron$ select public.cleanup_expired_recordings(); $cron$
  );
exception
  when others then
    raise notice 'pg_cron schedule skipped (%). Use Vercel cron /api/v1/cron/cleanup-recordings instead.',
      SQLERRM;
end;
$$;
