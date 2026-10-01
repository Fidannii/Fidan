#!/usr/bin/env node
/**
 * RLS Multi-Tenancy verification against a live Supabase project.
 *
 * Requires migration 004_rls_multi_tenancy_policies.sql applied.
 *
 * Env (.env.local):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_JWT_SECRET (optional – signs tenant JWTs; else uses Auth users)
 *
 * Usage:
 *   npm run test:rls
 *   node --env-file=.env.local scripts/test-supabase-rls.mjs
 */

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).trim();
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).trim();
const SUPABASE_ANON_KEY = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();
const SUPABASE_JWT_SECRET = (process.env.SUPABASE_JWT_SECRET || "").trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Fehler: Supabase Umgebungsvariablen fehlen (URL, SERVICE_ROLE, ANON).",
  );
  console.error(
    "   Setze sie in .env.local und führe `npm run test:rls` aus.",
  );
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createSignedJwt(orgId) {
  if (!SUPABASE_JWT_SECRET) return null;
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: crypto.randomUUID(),
      role: "authenticated",
      aud: "authenticated",
      app_metadata: { organization_id: orgId },
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }),
  );
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", SUPABASE_JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${signature}`;
}

function clientWithAccessToken(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createTenantUser(orgId, label) {
  const email = `rls-${label}-${Date.now()}@opsflow-test.local`;
  const password = `RlsTest-${crypto.randomBytes(8).toString("hex")}!`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { organization_id: orgId },
  });
  if (error) throw new Error(`Auth user ${label}: ${error.message}`);

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: session, error: signErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr || !session.session?.access_token) {
    throw new Error(`Sign-in ${label}: ${signErr?.message || "no token"}`);
  }

  return {
    userId: data.user.id,
    email,
    accessToken: session.session.access_token,
  };
}

async function runRlsVerification() {
  console.log("🧪 Starte RLS Multi-Tenancy Verification Test...\n");

  const created = {
    orgIds: [],
    leadIds: [],
    userIds: [],
  };

  try {
    const slugA = `tenant-a-${Date.now()}`;
    const slugB = `tenant-b-${Date.now()}`;

    const { data: orgA, error: errA } = await adminClient
      .from("organizations")
      .insert({
        name: "Tenant A (Nordblick Test)",
        slug: slugA,
      })
      .select()
      .single();

    const { data: orgB, error: errB } = await adminClient
      .from("organizations")
      .insert({
        name: "Tenant B (Südblick Test)",
        slug: slugB,
      })
      .select()
      .single();

    if (errA || errB || !orgA || !orgB) {
      throw new Error(
        `Org Setup fehlgeschlagen: ${errA?.message || errB?.message}`,
      );
    }
    created.orgIds.push(orgA.id, orgB.id);

    const { data: leadA, error: errLead } = await adminClient
      .from("leads")
      .insert({
        organization_id: orgA.id,
        full_name: "Vertraulicher Lead Tenant A",
        phone: "+491709998877",
        intent: "buy",
        status: "new",
        qualification_score: 80,
      })
      .select()
      .single();

    if (errLead || !leadA) {
      throw new Error(`Lead Inserierung fehlgeschlagen: ${errLead?.message}`);
    }
    created.leadIds.push(leadA.id);

    let clientTenantA;
    let clientTenantB;

    const jwtA = createSignedJwt(orgA.id);
    const jwtB = createSignedJwt(orgB.id);

    if (jwtA && jwtB) {
      console.log("🔑 Nutze mit SUPABASE_JWT_SECRET signierte Tenant-JWTs\n");
      clientTenantA = clientWithAccessToken(jwtA);
      clientTenantB = clientWithAccessToken(jwtB);
    } else {
      console.log(
        "🔑 SUPABASE_JWT_SECRET fehlt – nutze Auth-User + echte Sessions\n",
      );
      const userA = await createTenantUser(orgA.id, "a");
      const userB = await createTenantUser(orgB.id, "b");
      created.userIds.push(userA.userId, userB.userId);
      clientTenantA = clientWithAccessToken(userA.accessToken);
      clientTenantB = clientWithAccessToken(userB.accessToken);
    }

    const { data: fetchSelf, error: selfErr } = await clientTenantA
      .from("leads")
      .select("*")
      .eq("id", leadA.id);

    const { data: fetchCross, error: crossErr } = await clientTenantB
      .from("leads")
      .select("*")
      .eq("id", leadA.id);

    // Cross-tenant update must not change Tenant A row
    const { data: updateCross, error: updateErr } = await clientTenantB
      .from("leads")
      .update({ notes: "FORBIDDEN_CROSS_TENANT_WRITE" })
      .eq("id", leadA.id)
      .select();

    const { data: leadAfter } = await adminClient
      .from("leads")
      .select("notes")
      .eq("id", leadA.id)
      .single();

    const selfAccessWorked =
      !selfErr && Array.isArray(fetchSelf) && fetchSelf.length === 1;
    const crossAccessBlocked =
      !crossErr && Array.isArray(fetchCross) && fetchCross.length === 0;
    const crossUpdateBlocked =
      (!updateErr && Array.isArray(updateCross) && updateCross.length === 0) ||
      Boolean(updateErr);
    const notesUntouched = leadAfter?.notes !== "FORBIDDEN_CROSS_TENANT_WRITE";

    console.log(
      `📌 Tenant A Zugriff auf eigenen Lead: ${selfAccessWorked ? "✅ ERFOLGREICH" : "❌ FEHLER"}`,
    );
    if (selfErr) console.log(`   detail: ${selfErr.message}`);

    console.log(
      `🛡️ Tenant B Zugriff auf Tenant A Lead: ${crossAccessBlocked ? "✅ BLOCKIERT (0 Zeilen)" : "❌ SECURITY LEAK!"}`,
    );
    if (crossErr) console.log(`   detail: ${crossErr.message}`);

    console.log(
      `🛡️ Tenant B Update auf Tenant A Lead: ${crossUpdateBlocked && notesUntouched ? "✅ BLOCKIERT" : "❌ SECURITY LEAK!"}`,
    );
    if (updateErr) console.log(`   detail: ${updateErr.message}`);

    if (!selfAccessWorked || !crossAccessBlocked || !crossUpdateBlocked || !notesUntouched) {
      process.exitCode = 1;
    } else {
      console.log("\n🎉 RLS VERIFICATION ERFOLGREICH ABGESCHLOSSEN!");
    }
  } catch (error) {
    console.error("❌ Fehler bei RLS Verification:", error.message || error);
    process.exitCode = 1;
  } finally {
    console.log("\n🧹 Räume Testdaten auf…");
    if (created.leadIds.length) {
      await adminClient.from("leads").delete().in("id", created.leadIds);
    }
    if (created.orgIds.length) {
      await adminClient.from("organizations").delete().in("id", created.orgIds);
    }
    for (const userId of created.userIds) {
      await adminClient.auth.admin.deleteUser(userId);
    }
    console.log("🧹 Testdaten aufgeräumt.");
    process.exit(process.exitCode || 0);
  }
}

runRlsVerification();
