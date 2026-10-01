export type LeadIntent = "buy" | "rent" | "sell" | "finance" | "other";
export type LeadStatus =
  | "new"
  | "qualified"
  | "contacted"
  | "appointment"
  | "won"
  | "lost"
  | "spam";
export type LeadUrgency = "low" | "medium" | "high";
export type CallDirection = "inbound" | "outbound" | "simulator";
export type CallStatus =
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "transferred";
export type AgentStatus = "draft" | "live" | "paused";

export interface TranscriptTurn {
  role: "agent" | "user" | "system";
  content: string;
  timestamp?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone_number: string | null;
  timezone: string;
  recording_consent_enabled: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  organization_id: string;
  name: string;
  vertical: string;
  voice_id: string;
  system_prompt: string;
  phone_number: string | null;
  status: AgentStatus;
  retell_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  organization_id: string;
  agent_id: string | null;
  external_call_id: string | null;
  from_number: string | null;
  to_number: string | null;
  direction: CallDirection;
  status: CallStatus;
  duration_seconds: number;
  recording_url: string | null;
  transcript: TranscriptTurn[];
  summary: string | null;
  sentiment: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  call_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  intent: LeadIntent | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_locations: string[];
  property_type: string | null;
  rooms: number | null;
  move_in_date: string | null;
  urgency: LeadUrgency | null;
  qualification_score: number;
  status: LeadStatus;
  notes: string | null;
  estimated_pipeline_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface DemoStore {
  organization: Organization;
  agents: Agent[];
  calls: Call[];
  leads: Lead[];
}

export interface VoiceEventPayload {
  event: "call_started" | "call_ended" | "call_analyzed";
  call_id: string;
  agent_id?: string;
  from_number?: string;
  to_number?: string;
  direction?: CallDirection;
  duration_seconds?: number;
  recording_url?: string | null;
  transcript?: TranscriptTurn[];
  summary?: string;
  sentiment?: string;
  started_at?: string;
  ended_at?: string;
  lead?: Partial<Lead>;
}

export interface VoiceEventResponse {
  ok: boolean;
  call_id: string;
  lead_id?: string;
  message: string;
}
