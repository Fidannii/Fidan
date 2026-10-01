# Multi-Tenancy & RLS Verification

Dieses Dokument beschreibt die Mandantentrennung über Supabase Row Level Security.

## Migration

Datei: [`supabase/migrations/004_rls_multi_tenancy_policies.sql`](../supabase/migrations/004_rls_multi_tenancy_policies.sql)

- `public.current_org_id()` liest `organization_id` aus JWT `app_metadata` / `user_metadata`
- Fallback: `profiles.organization_id` für `auth.uid()`
- Granulare Policies auf `organizations`, `profiles`, `agents`, `leads`, `calls`, `knowledge_documents`

Service-Role (Webhook/Cron) **umgeht RLS** bewusst – App-Queries mit Anon/User-JWT bleiben tenant-scoped.

## User-Provisioning

Jeder Auth-User braucht:

```json
{
  "app_metadata": {
    "organization_id": "<uuid>"
  }
}
```

Optional zusätzlich Zeile in `public.profiles`.

## Test

```bash
# .env.local:
# SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
# SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_JWT_SECRET (optional, empfohlen)

npm run test:rls
```

Erwartung:

```
📌 Tenant A Zugriff auf eigenen Lead: ✅ ERFOLGREICH
🛡️ Tenant B Zugriff auf Tenant A Lead: ✅ BLOCKIERT (0 Zeilen)
🛡️ Tenant B Update auf Tenant A Lead: ✅ BLOCKIERT
🎉 RLS VERIFICATION ERFOLGREICH ABGESCHLOSSEN!
```

Ohne Supabase-Keys:

```
❌ Fehler: Supabase Umgebungsvariablen fehlen …
```
