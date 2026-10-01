import { resolveDataBackend, type DataBackend } from "@/lib/supabase/config";
import type {
  Call,
  DemoStore,
  Lead,
  LeadStatus,
  VoiceEventPayload,
  VoiceEventResponse,
} from "@/lib/db/types";

import * as demo from "@/lib/db/demo-store";
import * as supabase from "@/lib/db/supabase-store";

type StoreApi = {
  getStore: () => Promise<DemoStore>;
  listLeads: (filters?: {
    status?: LeadStatus | "all";
    intent?: string;
    q?: string;
  }) => Promise<Lead[]>;
  getLead: (id: string) => Promise<Lead | null>;
  getCall: (id: string) => Promise<Call | null>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<Lead | null>;
  listCalls: () => Promise<Call[]>;
  getDashboardStats: () => ReturnType<typeof demo.getDashboardStats>;
  ingestVoiceEvent: (
    payload: VoiceEventPayload,
  ) => Promise<VoiceEventResponse>;
  createSimulatorLead: (input: {
    transcript: Call["transcript"];
    summary: string;
    lead: Partial<Lead>;
    duration_seconds: number;
  }) => Promise<{ call: Call; lead: Lead }>;
  resetDemoStore: () => Promise<DemoStore>;
};

function apiFor(backend: DataBackend): StoreApi {
  return backend === "supabase" ? supabase : demo;
}

function active(): StoreApi {
  return apiFor(resolveDataBackend());
}

export function getActiveDataBackend(): DataBackend {
  return resolveDataBackend();
}

export const getStore = (...args: Parameters<StoreApi["getStore"]>) =>
  active().getStore(...args);
export const listLeads = (...args: Parameters<StoreApi["listLeads"]>) =>
  active().listLeads(...args);
export const getLead = (...args: Parameters<StoreApi["getLead"]>) =>
  active().getLead(...args);
export const getCall = (...args: Parameters<StoreApi["getCall"]>) =>
  active().getCall(...args);
export const updateLead = (...args: Parameters<StoreApi["updateLead"]>) =>
  active().updateLead(...args);
export const listCalls = (...args: Parameters<StoreApi["listCalls"]>) =>
  active().listCalls(...args);
export const getDashboardStats = (
  ...args: Parameters<StoreApi["getDashboardStats"]>
) => active().getDashboardStats(...args);
export const ingestVoiceEvent = (
  ...args: Parameters<StoreApi["ingestVoiceEvent"]>
) => active().ingestVoiceEvent(...args);
export const createSimulatorLead = (
  ...args: Parameters<StoreApi["createSimulatorLead"]>
) => active().createSimulatorLead(...args);
export const resetDemoStore = (
  ...args: Parameters<StoreApi["resetDemoStore"]>
) => active().resetDemoStore(...args);
