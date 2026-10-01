-- OpsFlow AI: 30-day audio retention cleanup (DSGVO Löschkonzept)
-- Apply in Supabase SQL Editor after schema.sql / seed.sql
-- Optional: enable pg_cron in Database → Extensions

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
  set recording_url = null
  where recording_url is not null
    and created_at < v_cutoff;

  get diagnostics v_count = row_count;

  return query select v_count, v_cutoff;
end;
$$;

comment on function public.cleanup_expired_call_recordings(integer) is
  'Nulls calls.recording_url older than retention_days (default 30) for DSGVO audio retention.';

-- Index to keep cleanup scans cheap
create index if not exists idx_calls_recording_retention
  on public.calls (created_at)
  where recording_url is not null;

-- Manual run:
--   select * from public.cleanup_expired_call_recordings(30);

-- Optional pg_cron schedule (requires extension "pg_cron")
-- Uncomment after: create extension if not exists pg_cron with schema extensions;
--
-- select cron.schedule(
--   'opsflow-cleanup-recordings-daily',
--   '15 3 * * *',  -- 03:15 UTC daily
--   $$select public.cleanup_expired_call_recordings(30);$$
-- );
