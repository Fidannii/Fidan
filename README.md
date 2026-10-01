# OpsFlow AI – Voice-Agent MVP (Immobilienmakler)

Autonomer 24/7 Inbound-Voice-Agent für Immobilienmakler: Anrufe entgegennehmen, Leads qualifizieren, Dashboard befüllen.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** + leichte Shadcn-ähnliche UI-Primitives
- **Demo-Store** (`data/demo-store.json`) – produktionsnah ohne externe Keys
- **Supabase Schema** bereit unter [`supabase/schema.sql`](supabase/schema.sql)
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

## Webhook Beispiel

```bash
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

## Produktion (Retell / Twilio / Supabase)

1. SQL aus `supabase/schema.sql` im Supabase SQL Editor (EU Frankfurt) ausführen.
2. Env setzen (siehe `.env.example`).
3. Retell-Agent mit Prompt aus `src/lib/ai/prompts/realEstateAgent.ts` anlegen.
4. Webhook-URL auf `/api/v1/webhooks/voice-event` zeigen.
5. Deutsche Twilio-Nummer verbinden.

## DSGVO Pilot-Checkliste

- [x] Aufzeichnungshinweis im Agent-Greeting
- [ ] AV-Verträge (Supabase, Vercel, Telephony)
- [ ] Audio-Löschung nach 30 Tagen
- [ ] Webhook-Signaturprüfung

## Monetarisierung (Kontext)

Starter 499 € · Pro 1.299 € · Enterprise 2.999 €+ · Usage 0,18 €/Min Voice
