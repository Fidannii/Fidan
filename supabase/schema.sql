-- OpsFlow AI – MVP Schema (Supabase / PostgreSQL, EU/Frankfurt)
-- Run in Supabase SQL Editor. Enables RLS for multi-tenant isolation.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Organizations (Maklerbüros)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  phone_number text,
  timezone text not null default 'Europe/Berlin',
  recording_consent_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'agent', 'admin')),
  created_at timestamptz not null default now()
);

-- AI Agents
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  vertical text not null default 'real_estate',
  voice_id text not null default 'eleven_labs_sarah',
  system_prompt text not null,
  phone_number text,
  status text not null default 'draft' check (status in ('draft', 'live', 'paused')),
  retell_agent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Knowledge documents (RAG)
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('pdf', 'url', 'faq', 'listing')),
  source_url text,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- Calls
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  external_call_id text,
  from_number text,
  to_number text,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound', 'simulator')),
  status text not null default 'completed' check (status in ('ringing', 'in_progress', 'completed', 'failed', 'transferred')),
  duration_seconds integer not null default 0,
  recording_url text,
  transcript jsonb not null default '[]'::jsonb,
  summary text,
  sentiment text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  full_name text,
  phone text,
  email text,
  intent text check (intent in ('buy', 'rent', 'sell', 'finance', 'other')),
  budget_min numeric,
  budget_max numeric,
  preferred_locations text[] default '{}',
  property_type text,
  rooms numeric,
  move_in_date date,
  urgency text check (urgency in ('low', 'medium', 'high')),
  qualification_score integer not null default 0 check (qualification_score between 0 and 100),
  status text not null default 'new' check (status in ('new', 'qualified', 'contacted', 'appointment', 'won', 'lost', 'spam')),
  notes text,
  estimated_pipeline_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_org_status on public.leads(organization_id, status);
create index if not exists idx_leads_org_created on public.leads(organization_id, created_at desc);
create index if not exists idx_calls_org_created on public.calls(organization_id, created_at desc);
create index if not exists idx_agents_org on public.agents(organization_id);

-- Auto-delete recordings after 30 days (DSGVO Löschkonzept)
-- Schedule via pg_cron or external job:
-- update public.calls set recording_url = null
-- where recording_url is not null and created_at < now() - interval '30 days';

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.calls enable row level security;
alter table public.leads enable row level security;

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create policy org_select on public.organizations
  for select using (id = public.current_org_id());

create policy profiles_select on public.profiles
  for select using (organization_id = public.current_org_id());

create policy agents_all on public.agents
  for all using (organization_id = public.current_org_id());

create policy knowledge_all on public.knowledge_documents
  for all using (organization_id = public.current_org_id());

create policy calls_all on public.calls
  for all using (organization_id = public.current_org_id());

create policy leads_all on public.leads
  for all using (organization_id = public.current_org_id());
