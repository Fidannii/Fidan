/**
 * Shared Retell custom analysis schema for OpsFlow Immobilien leads.
 * Keep in sync with `RetellCustomAnalysis` in mapRetellWebhook.ts
 */

export const customAnalysisSchema = {
  type: "object",
  properties: {
    client_name: {
      type: "string",
      description: "Vollständiger Name des Anrufers",
    },
    client_phone: {
      type: "string",
      description: "Rückrufnummer im E.164-Format",
    },
    intent: {
      type: "string",
      enum: ["buy", "rent", "sell"],
      description: "Absicht des Anrufers",
    },
    budget_max: {
      type: "number",
      description: "Maximales Budget in EUR",
    },
    location_preference: {
      type: "string",
      description: "Bevorzugte Lage / Stadtteil",
    },
    rooms_min: {
      type: "number",
      description: "Mindestanzahl benötigter Zimmer",
    },
    urgency: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Dringlichkeit des Anrufs",
    },
  },
  required: ["client_phone", "intent"],
};

/** Retell post_call_analysis_data entries (LLM config) */
export const postCallAnalysisData = [
  {
    name: "client_name",
    description: "Vollständiger Name des Anrufers",
    type: "string",
    examples: ["Mira Schulz", "Thomas Krause"],
  },
  {
    name: "client_phone",
    description: "Rückrufnummer im E.164-Format",
    type: "string",
    examples: ["+491701234567"],
  },
  {
    name: "intent",
    description: "Absicht des Anrufers: buy, rent oder sell",
    type: "enum",
    choices: ["buy", "rent", "sell"],
    examples: ["rent", "buy"],
  },
  {
    name: "budget_max",
    description: "Maximales Budget in EUR (Kaltmiete oder Kaufpreis)",
    type: "number",
    examples: [1550, 650000],
  },
  {
    name: "location_preference",
    description: "Bevorzugte Lage / Stadtteil",
    type: "string",
    examples: ["Ottensen", "Hamburg Altona"],
  },
  {
    name: "rooms_min",
    description: "Mindestanzahl benötigter Zimmer",
    type: "number",
    examples: [2, 3],
  },
  {
    name: "urgency",
    description: "Dringlichkeit des Anrufs",
    type: "enum",
    choices: ["high", "medium", "low"],
    examples: ["high"],
  },
];

/** Example blob for docs / JSON-style analysis configs */
export const customAnalysisExample = {
  client_name: "Mira Schulz",
  client_phone: "+491701234567",
  intent: "buy",
  budget_max: 650000,
  location_preference: "Hamburg Altona",
  rooms_min: 3,
  urgency: "high",
};
