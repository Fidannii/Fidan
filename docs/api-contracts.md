# OpsFlow AI API Contracts

## POST /api/v1/webhooks/voice-event

Triggered by Retell AI when a call is analyzed (also accepts internal demo payloads).

See also: [`docs/retell-webhook.md`](retell-webhook.md)

### Headers
- `x-retell-signature` — HMAC-SHA256 hex of raw body (required in production)

### Retell Request (`call_analyzed`)

```json
{
  "event": "call_analyzed",
  "call_id": "retell_abc123",
  "agent_id": "oai_agent_xxx",
  "from_number": "+491701112233",
  "to_number": "+49409876543",
  "start_timestamp": 1711800000000,
  "end_timestamp": 1711800120000,
  "recording_url": null,
  "transcript": [{ "role": "agent", "content": "..." }],
  "call_analysis": {
    "call_summary": "Mietinteresse Winterhude",
    "user_sentiment": "Positive",
    "custom_analysis_data": {
      "client_name": "Anna Berger",
      "client_phone": "+491701112233",
      "intent": "rent",
      "budget_max": 1800,
      "location_preference": "Winterhude",
      "rooms_min": 3,
      "urgency": "high"
    }
  }
}
```

### Internal/demo Request (still supported)

```json
{
  "event": "call_ended",
  "call_id": "demo_abc",
  "from_number": "+49170...",
  "duration_seconds": 120,
  "transcript": [{ "role": "agent", "content": "..." }],
  "summary": "Kurzfassung",
  "lead": {
    "full_name": "Name",
    "phone": "+49...",
    "intent": "rent",
    "budget_max": 1800,
    "preferred_locations": ["Winterhude"],
    "urgency": "high"
  }
}
```

### Response

```json
{
  "ok": true,
  "success": true,
  "call_id": "call_xxxx",
  "lead_id": "lead_xxxx",
  "message": "Call stored and lead created/updated"
}
```

## GET /api/v1/leads?status=qualified&intent=rent&q=Winterhude

Returns `{ "leads": Lead[] }`.

## GET /api/v1/leads/:id

Returns `{ "lead": Lead, "call": Call | null }`.

## PATCH /api/v1/leads/:id

Partial lead update.

## POST /api/v1/simulator

Actions: `start` | `step` | `finish` for the browser call simulator.
