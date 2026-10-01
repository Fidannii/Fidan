# DSGVO Audio Retention (30-Tage Cleanup)

OpsFlow speichert ggf. `calls.recording_url` (Retell/Twilio Temp-URL oder Storage-Link).
Nach **30 Tagen** werden diese Referenzen automatisch genullt (Löschkonzept für Pilot/Prod).

> Hinweis: Das Nullen der URL entfernt den App-Zugriff. Liegen Audiodateien zusätzlich in
> Supabase Storage / S3, müssen Bucket-Lifecycle-Policies parallel greifen (Follow-up).

---

## 1. SQL Migration (Supabase / pg function)

Datei: [`supabase/migrations/20261001_audio_retention_cleanup.sql`](../supabase/migrations/20261001_audio_retention_cleanup.sql)

Im Supabase SQL Editor ausführen. Erzeugt:

- `public.cleanup_expired_call_recordings(retention_days int default 30)`
- Partial Index auf ablaufende Recordings

Manuell testen:

```sql
select * from public.cleanup_expired_call_recordings(30);
```

Optional `pg_cron` (Extension aktivieren, dann Schedule-Kommentar in der Migration einkommentieren):

```sql
select cron.schedule(
  'opsflow-cleanup-recordings-daily',
  '15 3 * * *',
  $$select public.cleanup_expired_call_recordings(30);$$
);
```

---

## 2. Vercel Cron Route (App-seitig)

Endpoint: `GET|POST /api/cron/cleanup-recordings`

- Auth: `Authorization: Bearer $CRON_SECRET` (oder `?secret=`)
- In Production **ohne** `CRON_SECRET` → `401`
- Nutzt `cleanupExpiredRecordings()`:
  - Supabase: RPC, Fallback Direct-Update
  - Demo-Store: JSON-Mutation

`vercel.json` plant täglich **03:15 UTC**:

```json
{
  "crons": [{ "path": "/api/cron/cleanup-recordings", "schedule": "15 3 * * *" }]
}
```

Env:

```env
CRON_SECRET=long-random-string
```

Lokal:

```bash
curl -s "http://localhost:3000/api/cron/cleanup-recordings?days=30" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Ohne Secret nur außerhalb von Production erlaubt.

---

## 3. Empfohlene Pilot-Konfiguration

| Umgebung | Mechanismus |
|---|---|
| Supabase EU | SQL function + optional pg_cron |
| Vercel | Cron → `/api/cron/cleanup-recordings` |
| Lokal/Demo | Curl gegen Cron-Route oder Demo-Store Cleanup |

Doppelte Ausführung (pg_cron + Vercel) ist idempotent (bereits `null` → kein erneuter Effekt).
