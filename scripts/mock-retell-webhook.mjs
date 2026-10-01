#!/usr/bin/env node
/**
 * Local Retell webhook mock:
 * - Builds a call_analyzed payload with Immobilien custom_analysis_data
 * - Optionally signs with HMAC (RETELL_WEBHOOK_SECRET / RETELL_API_KEY)
 * - POSTs to /api/v1/webhooks/voice-event
 *
 * Usage:
 *   node scripts/mock-retell-webhook.mjs
 *   node scripts/mock-retell-webhook.mjs --unsigned
 *   BASE_URL=http://localhost:3000 RETELL_WEBHOOK_SECRET=devsecret node scripts/mock-retell-webhook.mjs
 */

import crypto from "crypto";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const secret =
  process.env.RETELL_WEBHOOK_SECRET ||
  process.env.RETELL_API_KEY ||
  "dev_retell_secret";
const unsigned = process.argv.includes("--unsigned");

const now = Date.now();
const payload = {
  event: "call_analyzed",
  call_id: `retell_mock_${now}`,
  agent_id: "agent_retell_external_1",
  from_number: "+491701234567",
  to_number: "+49409876543",
  direction: "inbound",
  start_timestamp: now - 125_000,
  end_timestamp: now,
  recording_url: null,
  transcript: [
    {
      role: "agent",
      content:
        "Guten Tag, Sie sprechen mit Sarah von Nordblick Immobilien. Dieses Gespräch kann zur Qualitätssicherung aufgezeichnet werden.",
    },
    {
      role: "user",
      content: "Hallo, ich suche eine Wohnung zur Miete in Ottensen.",
    },
    {
      role: "agent",
      content: "Gerne. Darf ich Ihren Namen und Ihre Telefonnummer notieren?",
    },
    {
      role: "user",
      content: "Clara Neumann, 0170 1234567.",
    },
  ],
  call_analysis: {
    call_summary:
      "Mietinteresse Ottensen, 2 Zimmer, Budget bis 1.550 €, Rückruf gewünscht.",
    user_sentiment: "Positive",
    custom_analysis_data: {
      client_name: "Clara Neumann",
      client_phone: "+491701234567",
      intent: "rent",
      budget_max: 1550,
      location_preference: "Ottensen",
      rooms_min: 2,
      urgency: "high",
    },
  },
};

const rawBody = JSON.stringify(payload);
const headers = {
  "Content-Type": "application/json",
};

if (!unsigned) {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  headers["x-retell-signature"] = signature;
  console.log("Signed with secret length:", secret.length);
} else {
  console.log("Sending unsigned payload (dev only)");
}

const res = await fetch(`${baseUrl}/api/v1/webhooks/voice-event`, {
  method: "POST",
  headers,
  body: rawBody,
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = text;
}

console.log("Status:", res.status);
console.log(JSON.stringify(json, null, 2));

if (!res.ok) process.exit(1);
