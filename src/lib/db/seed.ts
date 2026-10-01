import type { Agent, Call, DemoStore, Lead, Organization } from "./types";
import { REAL_ESTATE_SYSTEM_PROMPT } from "@/lib/ai/prompts/realEstateAgent";

const ORG_ID = "org_demo_immobilien";
const AGENT_ID = "agent_demo_sarah";

export const DEMO_ORG: Organization = {
  id: ORG_ID,
  name: "Nordblick Immobilien",
  slug: "nordblick",
  phone_number: "+49 40 1234567",
  timezone: "Europe/Berlin",
  recording_consent_enabled: true,
  created_at: "2026-01-10T09:00:00.000Z",
};

export const DEMO_AGENT: Agent = {
  id: AGENT_ID,
  organization_id: ORG_ID,
  name: "Sarah – Inbound Qualifizierung",
  vertical: "real_estate",
  voice_id: "eleven_labs_sarah",
  system_prompt: REAL_ESTATE_SYSTEM_PROMPT,
  phone_number: "+49 40 9876543",
  status: "live",
  retell_agent_id: "retell_demo_agent",
  created_at: "2026-01-12T10:00:00.000Z",
  updated_at: "2026-03-01T10:00:00.000Z",
};

const seedCalls: Call[] = [
  {
    id: "call_001",
    organization_id: ORG_ID,
    agent_id: AGENT_ID,
    external_call_id: "retell_c_001",
    from_number: "+49 171 5550101",
    to_number: "+49 40 9876543",
    direction: "inbound",
    status: "completed",
    duration_seconds: 142,
    recording_url: null,
    transcript: [
      {
        role: "agent",
        content:
          "Guten Tag, Sie sprechen mit Sarah von Nordblick Immobilien. Dieses Gespräch kann zur Qualitätssicherung aufgezeichnet werden. Wie kann ich Ihnen helfen?",
        timestamp: "2026-03-28T18:42:01.000Z",
      },
      {
        role: "user",
        content:
          "Hallo, ich interessiere mich für die 3-Zimmer-Wohnung in Winterhude, die ich online gesehen habe.",
        timestamp: "2026-03-28T18:42:12.000Z",
      },
      {
        role: "agent",
        content:
          "Sehr gerne. Darf ich Ihren Namen und eine Rückrufnummer notieren?",
        timestamp: "2026-03-28T18:42:18.000Z",
      },
      {
        role: "user",
        content: "Ja, ich heiße Anna Berger, meine Nummer ist 0171 5550101.",
        timestamp: "2026-03-28T18:42:28.000Z",
      },
      {
        role: "agent",
        content:
          "Danke, Frau Berger. Suchen Sie zur Miete oder zum Kauf, und in welchem Budgetrahmen bewegen Sie sich?",
        timestamp: "2026-03-28T18:42:35.000Z",
      },
      {
        role: "user",
        content:
          "Zur Miete, bis etwa 1.800 Euro kalt, Einzug möglichst im Mai.",
        timestamp: "2026-03-28T18:42:48.000Z",
      },
      {
        role: "agent",
        content:
          "Perfekt. Ich habe Sie als qualifizierte Interessentin erfasst und melde Sie an unser Team. Passt Ihnen ein Rückruf morgen Vormittag?",
        timestamp: "2026-03-28T18:43:05.000Z",
      },
      {
        role: "user",
        content: "Ja, gerne zwischen 10 und 12 Uhr.",
        timestamp: "2026-03-28T18:43:12.000Z",
      },
    ],
    summary:
      "Interessentin Anna Berger für 3-Zimmer Winterhude, Miete bis 1.800 €, Einzug Mai. Rückruf morgen 10–12 Uhr gewünscht.",
    sentiment: "positive",
    started_at: "2026-03-28T18:42:00.000Z",
    ended_at: "2026-03-28T18:44:22.000Z",
    created_at: "2026-03-28T18:44:22.000Z",
  },
  {
    id: "call_002",
    organization_id: ORG_ID,
    agent_id: AGENT_ID,
    external_call_id: "retell_c_002",
    from_number: "+49 160 4442211",
    to_number: "+49 40 9876543",
    direction: "inbound",
    status: "completed",
    duration_seconds: 98,
    recording_url: null,
    transcript: [
      {
        role: "agent",
        content:
          "Guten Tag, Sie sprechen mit Sarah von Nordblick Immobilien. Dieses Gespräch kann zur Qualitätssicherung aufgezeichnet werden. Wie kann ich Ihnen helfen?",
      },
      {
        role: "user",
        content:
          "Ich möchte eine Eigentumswohnung in Eppendorf kaufen, Budget bis 650.000 Euro.",
      },
      {
        role: "agent",
        content:
          "Verstehe. Darf ich Ihren Namen und Ihre Erreichbarkeit aufnehmen?",
      },
      {
        role: "user",
        content: "Thomas Krause, 0160 4442211, thomas.krause@mail.de",
      },
    ],
    summary:
      "Kaufinteressent Thomas Krause, ETW Eppendorf, Budget bis 650.000 €. Qualifiziert für Rückruf.",
    sentiment: "positive",
    started_at: "2026-03-29T11:05:00.000Z",
    ended_at: "2026-03-29T11:06:38.000Z",
    created_at: "2026-03-29T11:06:38.000Z",
  },
  {
    id: "call_003",
    organization_id: ORG_ID,
    agent_id: AGENT_ID,
    external_call_id: "retell_c_003",
    from_number: "+49 152 3338899",
    to_number: "+49 40 9876543",
    direction: "inbound",
    status: "completed",
    duration_seconds: 64,
    recording_url: null,
    transcript: [
      {
        role: "agent",
        content:
          "Guten Tag, Sie sprechen mit Sarah von Nordblick Immobilien. Dieses Gespräch kann zur Qualitätssicherung aufgezeichnet werden. Wie kann ich Ihnen helfen?",
      },
      {
        role: "user",
        content: "Ich habe die falsche Nummer gewählt, Entschuldigung.",
      },
      {
        role: "agent",
        content: "Kein Problem, einen schönen Tag noch.",
      },
    ],
    summary: "Falschwahl – kein Lead.",
    sentiment: "neutral",
    started_at: "2026-03-30T09:12:00.000Z",
    ended_at: "2026-03-30T09:13:04.000Z",
    created_at: "2026-03-30T09:13:04.000Z",
  },
];

const seedLeads: Lead[] = [
  {
    id: "lead_001",
    organization_id: ORG_ID,
    call_id: "call_001",
    full_name: "Anna Berger",
    phone: "+49 171 5550101",
    email: null,
    intent: "rent",
    budget_min: null,
    budget_max: 1800,
    preferred_locations: ["Winterhude", "Hamburg"],
    property_type: "Wohnung",
    rooms: 3,
    move_in_date: "2026-05-01",
    urgency: "high",
    qualification_score: 86,
    status: "qualified",
    notes: "Rückruf morgen 10–12 Uhr. Interessiert an Exposé Winterhude.",
    estimated_pipeline_value: 21600,
    created_at: "2026-03-28T18:44:22.000Z",
    updated_at: "2026-03-28T18:44:22.000Z",
  },
  {
    id: "lead_002",
    organization_id: ORG_ID,
    call_id: "call_002",
    full_name: "Thomas Krause",
    phone: "+49 160 4442211",
    email: "thomas.krause@mail.de",
    intent: "buy",
    budget_min: 450000,
    budget_max: 650000,
    preferred_locations: ["Eppendorf"],
    property_type: "Eigentumswohnung",
    rooms: 3,
    move_in_date: null,
    urgency: "medium",
    qualification_score: 92,
    status: "new",
    notes: "Kaufinteresse ETW Eppendorf. Finanzierung noch offen.",
    estimated_pipeline_value: 19500,
    created_at: "2026-03-29T11:06:38.000Z",
    updated_at: "2026-03-29T11:06:38.000Z",
  },
  {
    id: "lead_003",
    organization_id: ORG_ID,
    call_id: null,
    full_name: "Leila Hoffmann",
    phone: "+49 176 2223344",
    email: "leila.h@example.com",
    intent: "sell",
    budget_min: null,
    budget_max: null,
    preferred_locations: ["Altona"],
    property_type: "Reihenhaus",
    rooms: 5,
    move_in_date: null,
    urgency: "medium",
    qualification_score: 74,
    status: "contacted",
    notes: "Möchte Reihenhaus bewerten lassen.",
    estimated_pipeline_value: 28000,
    created_at: "2026-03-25T14:20:00.000Z",
    updated_at: "2026-03-27T09:00:00.000Z",
  },
];

export function createSeedStore(): DemoStore {
  return {
    organization: DEMO_ORG,
    agents: [DEMO_AGENT],
    calls: seedCalls,
    leads: seedLeads,
  };
}
