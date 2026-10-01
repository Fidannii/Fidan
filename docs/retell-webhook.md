# Retell Webhook Spec & HMAC

## Endpoint
`POST /api/v1/webhooks/voice-event`

## Handled event
Primary: `call_analyzed`  
Also accepted: `call_ended` (mapped identically for resilience)

Other events return `{ ok: true, status: "ignored" }`.

## Field mapping

| Retell field | OpsFlow target | Notes |
|---|---|---|
| `call_id` | `calls.external_call_id` | Idempotency key |
| `agent_id` | `calls.agent_id` | Only if UUID; else default org agent |
| `transcript` | `calls.transcript` | String or turn array normalized |
| `recording_url` | `calls.recording_url` | 30-day deletion is ops follow-up |
| `call_analysis.call_summary` | `calls.summary` | Dashboard summary |
| `call_analysis.custom_analysis_data` | `leads.*` | Immobilien fields |
| `start_timestamp` / `end_timestamp` | `calls.duration_seconds` | ms→sec if needed |

### `custom_analysis_data`
```ts
{
  client_name?: string;
  client_phone?: string;
  intent?: 'buy' | 'rent' | 'sell';
  budget_max?: number;
  location_preference?: string;
  rooms_min?: number;
  urgency?: 'high' | 'medium' | 'low';
}
```

## HMAC verification
- Header: `x-retell-signature` (hex, optional `sha256=` prefix)
- Key: `RETELL_WEBHOOK_SECRET` (fallback: `RETELL_API_KEY`)
- Algo: HMAC-SHA256 over **raw body**, timing-safe compare
- Enforcement:
  - always in `NODE_ENV=production`
  - always if signature header present
  - always if `RETELL_WEBHOOK_ENFORCE=true`
  - otherwise local unsigned demo payloads remain allowed

## Local mock test
```bash
# Terminal A
npm run dev

# Terminal B – signed request
RETELL_WEBHOOK_SECRET=dev_retell_secret \
  node scripts/mock-retell-webhook.mjs

# Unsigned (only works outside production and without enforce flag)
node scripts/mock-retell-webhook.mjs --unsigned
```

## Persistenz
Mapped payload goes through `ingestVoiceEvent()` in `src/lib/db/store.ts`
(Demo-Store oder Supabase, je nach Env).

## Simulator uses the same pipeline
`POST /api/v1/simulator` (`action=finish`) maps browser state to a Retell-compatible
`call_analyzed` event via `mapSimulatorFinishToRetellEvent`, then runs
`ingestRetellCompatibleEvent()` → same mapper + scoring + DB write path as live calls.

UI contract for `/dashboard/simulator` stays `{ call, lead }`.
