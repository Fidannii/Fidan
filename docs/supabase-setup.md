# OpsFlow AI – Supabase Client Anbindung

## Ziel
Die Data-Access-Layer kann zwischen **Demo-Store** und **Supabase** umschalten, ohne API-/UI-Verträge zu ändern.

## Architektur
- Facade: `src/lib/db/store.ts`
- Demo: `src/lib/db/demo-store.ts`
- Supabase: `src/lib/db/supabase-store.ts`
- Service Client: `src/lib/supabase/server.ts` (service role, server-only)
- Auswahl: `src/lib/supabase/config.ts` → `resolveDataBackend()`

## Backend-Auswahl
1. `DATA_BACKEND=demo` → immer JSON-Store
2. `DATA_BACKEND=supabase` → Supabase (Fehler wenn Keys fehlen)
3. unset → Supabase falls `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` gesetzt, sonst Demo

## Setup
1. Supabase-Projekt in **EU (Frankfurt)** anlegen
2. SQL ausführen:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
3. `.env.local` setzen:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
OPSFLOW_DEFAULT_ORG_ID=11111111-1111-1111-1111-111111111111
DATA_BACKEND=supabase
```

4. App neu starten (`npm run dev`)

## Wichtige Hinweise
- Der Service-Role-Client **umgeht RLS**. Queries sind deshalb in Application Code immer auf `organization_id` gescoped.
- User-Auth + RLS-enforced Client folgen in einem späteren PR.
- Webhook-HMAC bleibt bewusst Folgearbeit (Retell/Twilio).
- Ohne Env-Keys bleibt der MVP-Demo-Pfad unverändert lauffähig.
