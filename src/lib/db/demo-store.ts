import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { createSeedStore } from "./seed";
import { scoreLead } from "./scoring";
import type {
  Call,
  DemoStore,
  Lead,
  LeadStatus,
  VoiceEventPayload,
  VoiceEventResponse,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "demo-store.json");

async function ensureStore(): Promise<DemoStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as DemoStore;
  } catch {
    const seed = createSeedStore();
    await fs.writeFile(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

async function saveStore(store: DemoStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getStore(): Promise<DemoStore> {
  return ensureStore();
}

export async function listLeads(filters?: {
  status?: LeadStatus | "all";
  intent?: string;
  q?: string;
}): Promise<Lead[]> {
  const store = await ensureStore();
  let leads = [...store.leads].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );

  if (filters?.status && filters.status !== "all") {
    leads = leads.filter((l) => l.status === filters.status);
  }
  if (filters?.intent && filters.intent !== "all") {
    leads = leads.filter((l) => l.intent === filters.intent);
  }
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
  const store = await ensureStore();
  return store.leads.find((l) => l.id === id) ?? null;
}

export async function getCall(id: string): Promise<Call | null> {
  const store = await ensureStore();
  return store.calls.find((c) => c.id === id) ?? null;
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>,
): Promise<Lead | null> {
  const store = await ensureStore();
  const idx = store.leads.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  store.leads[idx] = {
    ...store.leads[idx],
    ...patch,
    id,
    updated_at: new Date().toISOString(),
  };
  await saveStore(store);
  return store.leads[idx];
}

export async function listCalls(): Promise<Call[]> {
  const store = await ensureStore();
  return [...store.calls].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
}

export async function getDashboardStats() {
  const store = await ensureStore();
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
  const store = await ensureStore();
  const orgId = store.organization.id;
  const now = new Date().toISOString();

  let call =
    store.calls.find((c) => c.external_call_id === payload.call_id) ??
    store.calls.find((c) => c.id === payload.call_id);

  if (!call) {
    call = {
      id: `call_${nanoid(8)}`,
      organization_id: orgId,
      agent_id: payload.agent_id ?? store.agents[0]?.id ?? null,
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
      created_at: now,
    };
    store.calls.unshift(call);
  } else {
    call = {
      ...call,
      from_number: payload.from_number ?? call.from_number,
      to_number: payload.to_number ?? call.to_number,
      duration_seconds: payload.duration_seconds ?? call.duration_seconds,
      recording_url: payload.recording_url ?? call.recording_url,
      transcript: payload.transcript ?? call.transcript,
      summary: payload.summary ?? call.summary,
      sentiment: payload.sentiment ?? call.sentiment,
      status: "completed",
      ended_at: payload.ended_at ?? call.ended_at ?? now,
    };
    const idx = store.calls.findIndex((c) => c.id === call!.id);
    store.calls[idx] = call;
  }

  let leadId: string | undefined;
  const hasLeadSignal =
    payload.lead &&
    (payload.lead.full_name || payload.lead.phone || payload.lead.email);

  if (hasLeadSignal && payload.event !== "call_started") {
    const leadPatch = payload.lead!;
    const qualification_score = scoreLead(leadPatch);
    const status: LeadStatus =
      qualification_score >= 70 ? "qualified" : "new";

    const existing = store.leads.find((l) => l.call_id === call!.id);
    if (existing) {
      const updated: Lead = {
        ...existing,
        ...leadPatch,
        id: existing.id,
        organization_id: orgId,
        call_id: call.id,
        preferred_locations:
          leadPatch.preferred_locations ?? existing.preferred_locations,
        qualification_score,
        status: leadPatch.status ?? status,
        updated_at: now,
      };
      const li = store.leads.findIndex((l) => l.id === existing.id);
      store.leads[li] = updated;
      leadId = updated.id;
    } else {
      const lead: Lead = {
        id: `lead_${nanoid(8)}`,
        organization_id: orgId,
        call_id: call.id,
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
        status: leadPatch.status ?? status,
        notes: leadPatch.notes ?? payload.summary ?? null,
        estimated_pipeline_value:
          leadPatch.estimated_pipeline_value ??
          (leadPatch.intent === "buy"
            ? 18000
            : leadPatch.intent === "rent"
              ? 12000
              : 15000),
        created_at: now,
        updated_at: now,
      };
      store.leads.unshift(lead);
      leadId = lead.id;
    }
  }

  await saveStore(store);

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
    started_at: new Date(Date.now() - input.duration_seconds * 1000).toISOString(),
    ended_at: new Date().toISOString(),
    lead: input.lead,
  });

  const store = await ensureStore();
  const call = store.calls.find((c) => c.id === result.call_id)!;
  const lead = store.leads.find((l) => l.id === result.lead_id)!;
  return { call, lead };
}

export async function resetDemoStore(): Promise<DemoStore> {
  const seed = createSeedStore();
  await saveStore(seed);
  return seed;
}

/** Null recording_url for calls created before cutoff (ISO). */
export async function cleanupDemoRecordings(cutoffIso: string): Promise<number> {
  const store = await ensureStore();
  const cutoff = +new Date(cutoffIso);
  let cleaned = 0;
  store.calls = store.calls.map((call) => {
    if (
      call.recording_url &&
      +new Date(call.created_at) < cutoff
    ) {
      cleaned += 1;
      return { ...call, recording_url: null };
    }
    return call;
  });
  if (cleaned > 0) await saveStore(store);
  return cleaned;
}
