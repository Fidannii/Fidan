# OpsFlow AI API Contracts

## POST /api/v1/webhooks/voice-event

Triggered by Retell AI / Twilio when a call ends (or is analyzed).

### Request

```json
{
  "event": "call_ended",
  "call_id": "retell_abc123",
  "agent_id": "agent_demo_sarah",
  "from_number": "+491701112233",
  "to_number": "+49409876543",
  "direction": "inbound",
  "duration_seconds": 120,
  "recording_url": null,
  "transcript": [
    { "role": "agent", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "summary": "Kurze Zusammenfassung",
  "sentiment": "positive",
  "started_at": "2026-03-30T18:00:00.000Z",
  "ended_at": "2026-03-30T18:02:00.000Z",
  "lead": {
    "full_name": "Name",
    "phone": "+49...",
    "email": null,
    "intent": "rent",
    "budget_max": 1800,
    "preferred_locations": ["Winterhude"],
    "property_type": "Wohnung",
    "rooms": 3,
    "urgency": "high",
    "notes": "Rückruf morgen"
  }
}
```

### Response

```json
{
  "ok": true,
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
