# OpsFlow AI – Voice-Agent MVP (Immobilienmakler)

Autonomer 24/7 Inbound-Voice-Agent für Immobilienmakler: Anrufe entgegennehmen, Leads qualifizieren, Dashboard befüllen.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** + leichte Shadcn-ähnliche UI-Primitives
- **Data Access Facade** (`src/lib/db/store.ts`) mit Backend-Switch:
  - Demo: `data/demo-store.json`
  - Prod-ready: Supabase Client (`@supabase/supabase-js`, Service Role)
- **Supabase Schema + Seed**: [`supabase/schema.sql`](supabase/schema.sql), [`supabase/seed.sql`](supabase/seed.sql)
- Setup-Doku: [`docs/supabase-setup.md`](docs/supabase-setup.md)
- Voice-Webhook: `POST /api/v1/webhooks/voice-event`
- Browser-Call-Simulator (Leitfaden für Retell/Twilio-Pilot)

## Quickstart

```bash
npm install
npm run dev
```

Öffnen:

- Landing: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Simulator: http://localhost:3000/dashboard/simulator
- Leads: http://localhost:3000/dashboard/leads

## Retell Live Sync (Pilot)

Runbook: [`docs/retell-setup-guide.md`](docs/retell-setup-guide.md)

```bash
# Validate prompt/schema payload without API calls
npm run sync:retell -- --dry-run

# Create/update Retell LLM + Agent (needs .env.local)
npm run sync:retell
```

## Webhook / Retell Mock

Retell Spec + HMAC: [`docs/retell-webhook.md`](docs/retell-webhook.md)

```bash
# Signed Retell-style mock (recommended)
RETELL_WEBHOOK_SECRET=dev_retell_secret npm run mock:retell

# Or unsigned internal demo payload
curl -X POST http://localhost:3000/api/v1/webhooks/voice-event \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "call_ended",
    "call_id": "retell_demo_99",
    "from_number": "+49 170 1112233",
    "duration_seconds": 95,
    "transcript": [
      {"role":"agent","content":"Guten Tag, Sie sprechen mit Sarah..."},
      {"role":"user","content":"Ich möchte in Ottensen mieten."}
    ],
    "summary": "Mietinteresse Ottensen",
    "lead": {
      "full_name": "Mira Schulz",
      "phone": "+49 170 1112233",
      "intent": "rent",
      "budget_max": 1600,
      "preferred_locations": ["Ottensen"],
      "urgency": "high"
    }
  }'
```

## Supabase umschalten

Siehe [`docs/supabase-setup.md`](docs/supabase-setup.md). Kurz:

```bash
# nach schema.sql + seed.sql
DATA_BACKEND=supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPSFLOW_DEFAULT_ORG_ID=11111111-1111-1111-1111-111111111111
```

Ohne diese Keys bleibt der Demo-Store aktiv.

## Produktion (Retell / Twilio / Supabase)

1. SQL aus `supabase/schema.sql` + `supabase/seed.sql` (EU Frankfurt) ausführen.
2. Env setzen (siehe `.env.example`) und `DATA_BACKEND=supabase`.
3. Retell-Agent mit Prompt aus `src/lib/ai/prompts/realEstateAgent.ts` anlegen.
4. Webhook-URL auf `/api/v1/webhooks/voice-event` zeigen (HMAC folgt separat).
5. Deutsche Twilio-Nummer verbinden.

## DSGVO Pilot-Checkliste

- [x] Aufzeichnungshinweis im Agent-Greeting
- [ ] AV-Verträge (Supabase, Vercel, Telephony)
- [x] Audio-Löschung nach 30 Tagen (SQL + Cron – [`docs/audio-retention.md`](docs/audio-retention.md))
- [x] Webhook-Signaturprüfung (HMAC; Secret in Prod setzen)

## Monetarisierung (Kontext)

Starter 499 € · Pro 1.299 € · Enterprise 2.999 €+ · Usage 0,18 €/Min Voice
