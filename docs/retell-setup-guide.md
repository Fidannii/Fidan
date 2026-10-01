# Retell Live-Agent Setup Runbook

Dieses Dokument beschreibt die Schritte zur Anbindung von OpsFlow AI an einen echten Retell-Account für Inbound-Telefonie (Pilot Nordblick / Immobilien).

---

## Voraussetzungen

1. Account auf [Retell AI](https://www.retellai.com)
2. `RETELL_API_KEY` im Retell Dashboard generiert
3. Öffentlich erreichbare Domain für Webhooks (Vercel Deployment oder `ngrok` lokal)
4. Repo-Setup (`npm install`) und dieses Runbook

Verwandte Docs:

- Webhook + HMAC: [`docs/retell-webhook.md`](retell-webhook.md)
- Shared Ingestion: Simulator und Live-Calls nutzen dieselbe Pipeline

---

## 1. Umgebungsvariablen (`.env.local`)

```env
# Retell Live Configuration
RETELL_API_KEY=key_xxxxxxxxxxxxxxxxx
RETELL_AGENT_ID=agent_xxxxxxxxxxxxxxxxx
RETELL_LLM_ID=llm_xxxxxxxxxxxxxxxxx
RETELL_VOICE_ID=11labs-Adrian
RETELL_WEBHOOK_SECRET=key_xxxxxxxxxxxxxxxxx

# Öffentliche URL für Inbound Webhook Calls
NEXT_PUBLIC_APP_URL=https://deine-domain.vercel.app

# Empfohlen für Live: HMAC erzwingen
RETELL_WEBHOOK_ENFORCE=true
```

Hinweise:

- `RETELL_WEBHOOK_SECRET` sollte dem Signing-Secret/API-Key entsprechen, den eure HMAC-Prüfung erwartet (siehe `verifyRetellSignature`).
- Ohne `NEXT_PUBLIC_APP_URL` setzt das Sync-Skript keine `webhook_url`.

---

## 2. Agenten synchronisieren (Prompt + Analysis Schema)

Das Sync-Skript liest den System-Prompt aus  
`src/lib/ai/prompts/realEstateAgent.ts`  
und das Analysis-Schema aus  
`src/lib/retell/customAnalysisSchema.mjs`.

### Dry-Run (ohne API-Key / ohne Side-Effects)

```bash
npm run sync:retell -- --dry-run
```

### Live-Sync

```bash
npm run sync:retell
```

Das Skript:

1. erstellt/aktualisiert das **Retell LLM** (`general_prompt`, `begin_message`, `post_call_analysis_data`)
2. erstellt/aktualisiert den **Retell Agent** (Voice, Sprache `de-DE`, Webhook, LLM-Link)
3. gibt `RETELL_LLM_ID` / `RETELL_AGENT_ID` aus, falls neu erzeugt

Trage neue IDs in `.env.local` ein und führe den Sync bei Prompt-Änderungen erneut aus.

---

## 3. Rufnummern-Kopplung (Retell Dashboard)

1. Im Retell Dashboard zu **Phone Numbers** navigieren
2. Deutsche Rufnummer (`+49`) kaufen **oder** bestehende Twilio-/SIP-Nummer verbinden
3. Nummer dem Agenten **OpsFlow AI - Sarah (Nordblick Immobilien)** zuweisen
4. Inbound-Type auf **Agent** setzen

---

## 4. Webhook & HMAC Verification Check

1. Webhook-URL muss zeigen auf:

   `${NEXT_PUBLIC_APP_URL}/api/v1/webhooks/voice-event`

2. Nach einem Testanruf sendet Retell typischerweise `call_analyzed`
3. Im OpsFlow Dashboard unter `/dashboard/leads` prüfen, ob der Lead über die Ingestion-Pipeline erscheint
4. Bei Signaturfehlern (`401`):
   - `RETELL_WEBHOOK_SECRET` / `RETELL_API_KEY` prüfen
   - Raw-Body-HMAC (Header `x-retell-signature`) verifizieren
   - lokal mit `npm run mock:retell` gegen dieselbe Route testen

---

## 5. Custom Analysis Alignment Checklist

| Feld (`custom_analysis_data`) | OpsFlow Lead-Feld | Pflicht |
|---|---|---|
| `client_name` | `leads.full_name` | nein |
| `client_phone` | `leads.phone` | ja (Schema) |
| `intent` (`buy`/`rent`/`sell`) | `leads.intent` | ja (Schema) |
| `budget_max` | `leads.budget_max` | nein |
| `location_preference` | `leads.preferred_locations[]` | nein |
| `rooms_min` | `leads.rooms` | nein |
| `urgency` | `leads.urgency` | nein |

Source of truth im Repo:

- Interface: `RetellCustomAnalysis` in `src/lib/retell/mapRetellWebhook.ts`
- Schema für Sync: `src/lib/retell/customAnalysisSchema.mjs`

---

## 6. Pilot Go-Live Smoke Test

1. `npm run sync:retell`
2. Inbound-Nummer anrufen
3. Gespräch mit Miet-/Kaufinteresse führen (Name, Telefon, Lage, Budget)
4. `/dashboard/leads` → Lead vorhanden, Score/Status gesetzt
5. Lead-Detail → Transkript + Summary sichtbar

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Sync 401 von Retell | `RETELL_API_KEY` ungültig |
| Webhook kommt nicht an | öffentliche URL / Vercel logs / ngrok |
| Webhook 401 OpsFlow | HMAC Secret / `RETELL_WEBHOOK_ENFORCE` |
| Lead ohne Felder | Analysis Schema in Retell vs. `customAnalysisSchema.mjs` |
| Prompt wirkt veraltet | Sync erneut ausführen nach Prompt-Änderung |
