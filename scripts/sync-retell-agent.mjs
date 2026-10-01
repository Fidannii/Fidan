#!/usr/bin/env node
/**
 * Sync OpsFlow real-estate prompt + analysis schema to Retell (LLM + Agent).
 *
 * Usage:
 *   npm run sync:retell
 *   npm run sync:retell -- --dry-run
 *
 * Env:
 *   RETELL_API_KEY (required unless --dry-run)
 *   RETELL_LLM_ID (optional – create if missing)
 *   RETELL_AGENT_ID (optional – create if missing)
 *   RETELL_VOICE_ID (optional)
 *   NEXT_PUBLIC_APP_URL (webhook base URL)
 */

import {
  customAnalysisExample,
  customAnalysisSchema,
  postCallAnalysisData,
} from "../src/lib/retell/customAnalysisSchema.mjs";
import { loadRealEstateSystemPrompt } from "./lib/loadRealEstatePrompt.mjs";

const RETELL_API_BASE = "https://api.retellai.com";
const dryRun = process.argv.includes("--dry-run");

const RETELL_API_KEY = process.env.RETELL_API_KEY?.trim();
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID?.trim();
const RETELL_LLM_ID = process.env.RETELL_LLM_ID?.trim();
const RETELL_VOICE_ID =
  process.env.RETELL_VOICE_ID?.trim() || "11labs-Adrian";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const WEBHOOK_URL = APP_URL
  ? `${APP_URL}/api/v1/webhooks/voice-event`
  : undefined;

if (!RETELL_API_KEY && !dryRun) {
  console.error("❌ Fehler: RETELL_API_KEY fehlt in den Umgebungsvariablen.");
  console.error("   Tipp: npm run sync:retell -- --dry-run  (ohne API-Call)");
  process.exit(1);
}

const systemPrompt = loadRealEstateSystemPrompt();

const llmPayload = {
  general_prompt: systemPrompt,
  begin_message:
    "Guten Tag, Sie sprechen mit Sarah von Nordblick Immobilien. Dieses Gespräch kann zur Qualitätssicherung aufgezeichnet werden. Wie kann ich Ihnen helfen?",
  post_call_analysis_data: postCallAnalysisData,
  // Some Retell accounts also accept a JSON analysis descriptor:
  // kept in payload meta for operators / future API versions.
  _opsflow_custom_analysis_schema: customAnalysisSchema,
  _opsflow_custom_analysis_example: customAnalysisExample,
};

const agentPayloadBase = {
  agent_name: "OpsFlow AI - Sarah (Nordblick Immobilien)",
  voice_id: RETELL_VOICE_ID,
  language: "de-DE",
  webhook_url: WEBHOOK_URL,
  opt_out_sensitive_data_storage: false,
};

async function retellFetch(pathname, method, body) {
  const res = await fetch(`${RETELL_API_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Retell API ${method} ${pathname} → ${res.status}: ${JSON.stringify(data)}`,
    );
  }
  return data;
}

function stripInternalFields(payload) {
  const clone = { ...payload };
  delete clone._opsflow_custom_analysis_schema;
  delete clone._opsflow_custom_analysis_example;
  return clone;
}

async function syncLlm() {
  const body = stripInternalFields(llmPayload);
  if (dryRun) {
    return {
      llm_id: RETELL_LLM_ID || "llm_dry_run",
      dry: true,
      body,
    };
  }

  if (RETELL_LLM_ID) {
    console.log(`↻ Update Retell LLM ${RETELL_LLM_ID}`);
    return retellFetch(`/update-retell-llm/${RETELL_LLM_ID}`, "PATCH", body);
  }

  console.log("＋ Create Retell LLM");
  return retellFetch("/create-retell-llm", "POST", body);
}

async function syncAgent(llmId) {
  const body = {
    ...agentPayloadBase,
    response_engine: {
      type: "retell-llm",
      llm_id: llmId,
    },
  };

  if (dryRun) {
    return {
      agent_id: RETELL_AGENT_ID || "agent_dry_run",
      dry: true,
      body,
    };
  }

  if (RETELL_AGENT_ID) {
    console.log(`↻ Update Retell Agent ${RETELL_AGENT_ID}`);
    return retellFetch(`/update-agent/${RETELL_AGENT_ID}`, "PATCH", body);
  }

  console.log("＋ Create Retell Agent");
  return retellFetch("/create-agent", "POST", body);
}

async function main() {
  console.log("🚀 OpsFlow → Retell Sync");
  console.log(`   Prompt length: ${systemPrompt.length} chars`);
  console.log(`   Webhook: ${WEBHOOK_URL ?? "(nicht gesetzt – NEXT_PUBLIC_APP_URL)"}`);
  console.log(`   Voice: ${RETELL_VOICE_ID}`);
  if (dryRun) console.log("   Mode: DRY-RUN (kein API-Call)");

  try {
    const llm = await syncLlm();
    const llmId = llm.llm_id || RETELL_LLM_ID;
    if (!llmId) throw new Error("Retell LLM response missing llm_id");

    const agent = await syncAgent(llmId);
    const agentId = agent.agent_id || RETELL_AGENT_ID;

    console.log("✅ Agent/LLM erfolgreich synchronisiert!");
    console.log(`📌 LLM ID:   ${llmId}`);
    console.log(`📌 Agent ID: ${agentId}`);

    if (!RETELL_LLM_ID || !RETELL_AGENT_ID) {
      console.log("");
      console.log("⚠️  Bitte in .env.local eintragen:");
      if (!RETELL_LLM_ID) console.log(`RETELL_LLM_ID=${llmId}`);
      if (!RETELL_AGENT_ID) console.log(`RETELL_AGENT_ID=${agentId}`);
    }

    if (!WEBHOOK_URL) {
      console.log("");
      console.log(
        "⚠️  NEXT_PUBLIC_APP_URL fehlt – webhook_url wurde nicht gesetzt.",
      );
      console.log(
        "   Für Live-Tests: öffentliche URL (Vercel/ngrok) setzen und Sync erneut ausführen.",
      );
    }

    if (dryRun) {
      console.log("");
      console.log("Dry-run LLM body keys:", Object.keys(llm.body || {}));
      console.log("Dry-run Agent body:", JSON.stringify(agent.body, null, 2));
    }
  } catch (err) {
    console.error("❌ Fehler beim Sync:", err.message || err);
    process.exit(1);
  }
}

main();
