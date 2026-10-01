# DSGVO Audio Retention (30-Tage Cleanup)

OpsFlow speichert ggf. `calls.recording_url`. Nach **30 Tagen** wird die Referenz
automatisch auf `NULL` gesetzt.

> Nullen der URL entfernt den App-Zugriff. Zusätzliche Storage-Buckets brauchen
> eigene Lifecycle-Policies (Follow-up).

---

## 1. SQL Migration (Supabase)

Datei: [`supabase/migrations/003_audio_retention_cleanup.sql`](../supabase/migrations/003_audio_retention_cleanup.sql)

```sql
select public.cleanup_expired_recordings();
```

Plant optional `pg_cron` um **03:00 UTC**. Schlägt das Schedule fehl (Free-Tier),
greift die Vercel-Cron-Route.

### Manueller SQL-Test

```sql
-- A. Test-Datensatz mit altem Datum anlegen
insert into public.calls (
  organization_id,
  external_call_id,
  recording_url,
  created_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  'test_old_call',
  'https://audio.retellai.com/old_sample.wav',
  now() - interval '31 days'
);

-- B. Cleanup manuell ausführen
select public.cleanup_expired_recordings();

-- C. Prüfen ob recording_url NULL ist
select id, external_call_id, recording_url
from public.calls
where external_call_id = 'test_old_call';
```

---

## 2. Vercel Cron Endpoint

Canonical path: `GET|POST /api/v1/cron/cleanup-recordings`  
Legacy alias: `/api/cron/cleanup-recordings`

Auth:

```http
Authorization: Bearer $CRON_SECRET
```

Ohne `CRON_SECRET` nur außerhalb Production erlaubt.

```bash
curl -s http://localhost:3000/api/v1/cron/cleanup-recordings \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 3. `vercel.json`

Täglich **03:00 UTC**:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/v1/cron/cleanup-recordings",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

## Env

```env
# ==========================================
# DSGVO & CRON SECURITY
# ==========================================
CRON_SECRET=your_random_cron_secret_here
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
