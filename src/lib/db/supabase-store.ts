import { nanoid } from "nanoid";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getDefaultOrganizationId } from "@/lib/supabase/config";
import { scoreLead } from "@/lib/db/scoring";
import type {
  Agent,
  Call,
  DemoStore,
  Lead,
  LeadStatus,
  Organization,
  VoiceEventPayload,
  VoiceEventResponse,
} from "@/lib/db/types";

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapOrg(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    phone_number: (row.phone_number as string) ?? null,
    timezone: String(row.timezone ?? "Europe/Berlin"),
    recording_consent_enabled: Boolean(row.recording_consent_enabled ?? true),
    created_at: String(row.created_at),
  };
}

function mapAgent(row: Record<string, unknown>): Agent {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    name: String(row.name),
    vertical: String(row.vertical ?? "real_estate"),
    voice_id: String(row.voice_id ?? "eleven_labs_sarah"),
    system_prompt: String(row.system_prompt ?? ""),
    phone_number: (row.phone_number as string) ?? null,
    status: (row.status as Agent["status"]) ?? "draft",
    retell_agent_id: (row.retell_agent_id as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapCall(row: Record<string, unknown>): Call {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    agent_id: (row.agent_id as string) ?? null,
    external_call_id: (row.external_call_id as string) ?? null,
    from_number: (row.from_number as string) ?? null,
    to_number: (row.to_number as string) ?? null,
    direction: (row.direction as Call["direction"]) ?? "inbound",
    status: (row.status as Call["status"]) ?? "completed",
    duration_seconds: Number(row.duration_seconds ?? 0),
    recording_url: (row.recording_url as string) ?? null,
    transcript: Array.isArray(row.transcript) ? row.transcript : [],
    summary: (row.summary as string) ?? null,
    sentiment: (row.sentiment as string) ?? null,
    started_at: (row.started_at as string) ?? null,
    ended_at: (row.ended_at as string) ?? null,
    created_at: String(row.created_at),
  };
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    call_id: (row.call_id as string) ?? null,
    full_name: (row.full_name as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    intent: (row.intent as Lead["intent"]) ?? null,
    budget_min: num(row.budget_min),
    budget_max: num(row.budget_max),
    preferred_locations: Array.isArray(row.preferred_locations)
      ? (row.preferred_locations as string[])
      : [],
    property_type: (row.property_type as string) ?? null,
    rooms: num(row.rooms),
    move_in_date: (row.move_in_date as string) ?? null,
    urgency: (row.urgency as Lead["urgency"]) ?? null,
    qualification_score: Number(row.qualification_score ?? 0),
    status: (row.status as LeadStatus) ?? "new",
    notes: (row.notes as string) ?? null,
    estimated_pipeline_value: num(row.estimated_pipeline_value),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function resolveOrganizationId(): Promise<string> {
  const fromEnv = getDefaultOrganizationId();
  if (fromEnv) return fromEnv;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "nordblick")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error(
      "No organization found. Set OPSFLOW_DEFAULT_ORG_ID or run supabase/seed.sql",
    );
  }
  return String(data.id);
}

export async function getStore(): Promise<DemoStore> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();

  const [orgRes, agentsRes, callsRes, leadsRes] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).single(),
    supabase.from("agents").select("*").eq("organization_id", orgId),
    supabase
      .from("calls")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  if (orgRes.error) throw orgRes.error;
  if (agentsRes.error) throw agentsRes.error;
  if (callsRes.error) throw callsRes.error;
  if (leadsRes.error) throw leadsRes.error;

  return {
    organization: mapOrg(orgRes.data as Record<string, unknown>),
    agents: (agentsRes.data ?? []).map((r) =>
      mapAgent(r as Record<string, unknown>),
    ),
    calls: (callsRes.data ?? []).map((r) =>
      mapCall(r as Record<string, unknown>),
    ),
    leads: (leadsRes.data ?? []).map((r) =>
      mapLead(r as Record<string, unknown>),
    ),
  };
}

export async function listLeads(filters?: {
  status?: LeadStatus | "all";
  intent?: string;
  q?: string;
}): Promise<Lead[]> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();

  let query = supabase
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.intent && filters.intent !== "all") {
    query = query.eq("intent", filters.intent);
  }

  const { data, error } = await query;
  if (error) throw error;

  let leads = (data ?? []).map((r) => mapLead(r as Record<string, unknown>));
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.full_name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.preferred_locations.some((loc) => loc.toLowerCase().includes(q)),
    );
  }
  return leads;
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLead(data as Record<string, unknown>) : null;
}

export async function getCall(id: string): Promise<Call | null> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCall(data as Record<string, unknown>) : null;
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>,
): Promise<Lead | null> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  delete (payload as { id?: string }).id;
  delete (payload as { organization_id?: string }).organization_id;

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("organization_id", orgId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? mapLead(data as Record<string, unknown>) : null;
}

export async function listCalls(): Promise<Call[]> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapCall(r as Record<string, unknown>));
}

export async function getDashboardStats() {
  const store = await getStore();
  const leads = store.leads;
  const calls = store.calls;
  const qualified = leads.filter((l) =>
    ["qualified", "contacted", "appointment", "won"].includes(l.status),
  );
  const pipeline = leads.reduce(
    (sum, l) => sum + (l.estimated_pipeline_value ?? 0),
    0,
  );
  const avgScore =
    leads.length === 0
      ? 0
      : Math.round(
          leads.reduce((s, l) => s + l.qualification_score, 0) / leads.length,
        );

  return {
    organization: store.organization,
    agents: store.agents,
    totalLeads: leads.length,
    qualifiedLeads: qualified.length,
    totalCalls: calls.length,
    avgQualificationScore: avgScore,
    pipelineValue: pipeline,
    conversionRate:
      calls.length === 0
        ? 0
        : Math.round((qualified.length / calls.length) * 100),
  };
}

export async function ingestVoiceEvent(
  payload: VoiceEventPayload,
): Promise<VoiceEventResponse> {
  const supabase = getServiceSupabase();
  const orgId = await resolveOrganizationId();
  const now = new Date().toISOString();

  const { data: agents } = await supabase
    .from("agents")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1);
  const defaultAgentId = (agents?.[0]?.id as string | undefined) ?? null;

  const { data: existingByExternal } = await supabase
    .from("calls")
    .select("*")
    .eq("organization_id", orgId)
    .eq("external_call_id", payload.call_id)
    .maybeSingle();

  let callRow = existingByExternal as Record<string, unknown> | null;

  if (!callRow) {
    const { data: existingById } = await supabase
      .from("calls")
      .select("*")
      .eq("organization_id", orgId)
      .eq("id", payload.call_id)
      .maybeSingle();
    callRow = (existingById as Record<string, unknown> | null) ?? null;
  }

  if (!callRow) {
    const agentId =
      payload.agent_id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.agent_id,
      )
        ? payload.agent_id
        : defaultAgentId;

    const insert = {
      organization_id: orgId,
      agent_id: agentId,
      external_call_id: payload.call_id,
      from_number: payload.from_number ?? null,
      to_number: payload.to_number ?? null,
      direction: payload.direction ?? "inbound",
      status: "completed",
      duration_seconds: payload.duration_seconds ?? 0,
      recording_url: payload.recording_url ?? null,
      transcript: payload.transcript ?? [],
      summary: payload.summary ?? null,
      sentiment: payload.sentiment ?? null,
      started_at: payload.started_at ?? now,
      ended_at: payload.ended_at ?? now,
    };
    const { data, error } = await supabase
      .from("calls")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw error;
    callRow = data as Record<string, unknown>;
  } else {
    const update = {
      from_number: payload.from_number ?? callRow.from_number,
      to_number: payload.to_number ?? callRow.to_number,
      duration_seconds:
        payload.duration_seconds ?? callRow.duration_seconds ?? 0,
      recording_url: payload.recording_url ?? callRow.recording_url,
      transcript: payload.transcript ?? callRow.transcript ?? [],
      summary: payload.summary ?? callRow.summary,
      sentiment: payload.sentiment ?? callRow.sentiment,
      status: "completed",
      ended_at: payload.ended_at ?? callRow.ended_at ?? now,
    };
    const { data, error } = await supabase
      .from("calls")
      .update(update)
      .eq("id", callRow.id)
      .eq("organization_id", orgId)
      .select("*")
      .single();
    if (error) throw error;
    callRow = data as Record<string, unknown>;
  }

  const call = mapCall(callRow);
  let leadId: string | undefined;

  const hasLeadSignal =
    payload.lead &&
    (payload.lead.full_name || payload.lead.phone || payload.lead.email);

  if (hasLeadSignal && payload.event !== "call_started") {
    const leadPatch = payload.lead!;
    const qualification_score = scoreLead(leadPatch);
    const status: LeadStatus =
      leadPatch.status ?? (qualification_score >= 70 ? "qualified" : "new");

    const { data: existingLead } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", orgId)
      .eq("call_id", call.id)
      .maybeSingle();

    const base = {
      full_name: leadPatch.full_name ?? null,
      phone: leadPatch.phone ?? payload.from_number ?? null,
      email: leadPatch.email ?? null,
      intent: leadPatch.intent ?? null,
      budget_min: leadPatch.budget_min ?? null,
      budget_max: leadPatch.budget_max ?? null,
      preferred_locations: leadPatch.preferred_locations ?? [],
      property_type: leadPatch.property_type ?? null,
      rooms: leadPatch.rooms ?? null,
      move_in_date: leadPatch.move_in_date ?? null,
      urgency: leadPatch.urgency ?? null,
      qualification_score,
      status,
      notes: leadPatch.notes ?? payload.summary ?? null,
      estimated_pipeline_value:
        leadPatch.estimated_pipeline_value ??
        (leadPatch.intent === "buy"
          ? 18000
          : leadPatch.intent === "rent"
            ? 12000
            : 15000),
      updated_at: now,
    };

    if (existingLead) {
      const { data, error } = await supabase
        .from("leads")
        .update({
          ...base,
          preferred_locations:
            leadPatch.preferred_locations ??
            existingLead.preferred_locations ??
            [],
        })
        .eq("id", existingLead.id)
        .eq("organization_id", orgId)
        .select("id")
        .single();
      if (error) throw error;
      leadId = String(data.id);
    } else {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          organization_id: orgId,
          call_id: call.id,
          ...base,
        })
        .select("id")
        .single();
      if (error) throw error;
      leadId = String(data.id);
    }
  }

  return {
    ok: true,
    call_id: call.id,
    lead_id: leadId,
    message: leadId
      ? "Call stored and lead created/updated"
      : "Call stored",
  };
}

export async function createSimulatorLead(input: {
  transcript: Call["transcript"];
  summary: string;
  lead: Partial<Lead>;
  duration_seconds: number;
}): Promise<{ call: Call; lead: Lead }> {
  const result = await ingestVoiceEvent({
    event: "call_ended",
    call_id: `sim_${nanoid(10)}`,
    direction: "simulator",
    duration_seconds: input.duration_seconds,
    transcript: input.transcript,
    summary: input.summary,
    sentiment: "positive",
    started_at: new Date(
      Date.now() - input.duration_seconds * 1000,
    ).toISOString(),
    ended_at: new Date().toISOString(),
    lead: input.lead,
  });

  const call = await getCall(result.call_id);
  const lead = result.lead_id ? await getLead(result.lead_id) : null;
  if (!call || !lead) {
    throw new Error("Simulator lead persistence failed in Supabase");
  }
  return { call, lead };
}

export async function resetDemoStore(): Promise<DemoStore> {
  throw new Error(
    "resetDemoStore is only available in demo backend mode",
  );
}
