-- 004_rls_multi_tenancy_policies.sql
-- Strict tenant isolation by organization_id via JWT claims.
-- Apply after schema.sql (+ seed/003 as needed).

-- 1. Helper: Org-ID from JWT app_metadata / user_metadata, fallback profiles
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    (
      nullif(current_setting('request.jwt.claims', true), '')::jsonb
      -> 'app_metadata'
      ->> 'organization_id'
    )::uuid,
    (
      nullif(current_setting('request.jwt.claims', true), '')::jsonb
      -> 'user_metadata'
      ->> 'organization_id'
    )::uuid,
    (
      select p.organization_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );
$$;

comment on function public.current_org_id() is
  'Resolves tenant organization_id from JWT claims (preferred) or profiles row.';

-- 2. RLS auf Kerntabellen aktivieren
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.leads enable row level security;
alter table public.calls enable row level security;

-- Drop legacy broad policies from schema.sql bootstrap
drop policy if exists org_select on public.organizations;
drop policy if exists profiles_select on public.profiles;
drop policy if exists agents_all on public.agents;
drop policy if exists knowledge_all on public.knowledge_documents;
drop policy if exists calls_all on public.calls;
drop policy if exists leads_all on public.leads;

-- 3. ORGANIZATIONS
drop policy if exists "Orgs tenant isolation select" on public.organizations;
create policy "Orgs tenant isolation select" on public.organizations
  for select using (id = public.current_org_id());

-- 4. PROFILES
drop policy if exists "Profiles tenant isolation select" on public.profiles;
create policy "Profiles tenant isolation select" on public.profiles
  for select using (organization_id = public.current_org_id());

drop policy if exists "Profiles tenant isolation update" on public.profiles;
create policy "Profiles tenant isolation update" on public.profiles
  for update using (
    organization_id = public.current_org_id()
    and id = auth.uid()
  );

-- 5. LEADS POLICIES
drop policy if exists "Leads tenant isolation select" on public.leads;
create policy "Leads tenant isolation select" on public.leads
  for select using (organization_id = public.current_org_id());

drop policy if exists "Leads tenant isolation insert" on public.leads;
create policy "Leads tenant isolation insert" on public.leads
  for insert with check (organization_id = public.current_org_id());

drop policy if exists "Leads tenant isolation update" on public.leads;
create policy "Leads tenant isolation update" on public.leads
  for update using (organization_id = public.current_org_id());

drop policy if exists "Leads tenant isolation delete" on public.leads;
create policy "Leads tenant isolation delete" on public.leads
  for delete using (organization_id = public.current_org_id());

-- 6. CALLS POLICIES
drop policy if exists "Calls tenant isolation select" on public.calls;
create policy "Calls tenant isolation select" on public.calls
  for select using (organization_id = public.current_org_id());

drop policy if exists "Calls tenant isolation insert" on public.calls;
create policy "Calls tenant isolation insert" on public.calls
  for insert with check (organization_id = public.current_org_id());

drop policy if exists "Calls tenant isolation update" on public.calls;
create policy "Calls tenant isolation update" on public.calls
  for update using (organization_id = public.current_org_id());

drop policy if exists "Calls tenant isolation delete" on public.calls;
create policy "Calls tenant isolation delete" on public.calls
  for delete using (organization_id = public.current_org_id());

-- 7. AGENTS POLICIES
drop policy if exists "Agents tenant isolation select" on public.agents;
create policy "Agents tenant isolation select" on public.agents
  for select using (organization_id = public.current_org_id());

drop policy if exists "Agents tenant isolation insert" on public.agents;
create policy "Agents tenant isolation insert" on public.agents
  for insert with check (organization_id = public.current_org_id());

drop policy if exists "Agents tenant isolation update" on public.agents;
create policy "Agents tenant isolation update" on public.agents
  for update using (organization_id = public.current_org_id());

-- 8. KNOWLEDGE DOCUMENTS
drop policy if exists "Knowledge tenant isolation select" on public.knowledge_documents;
create policy "Knowledge tenant isolation select" on public.knowledge_documents
  for select using (organization_id = public.current_org_id());

drop policy if exists "Knowledge tenant isolation write" on public.knowledge_documents;
create policy "Knowledge tenant isolation write" on public.knowledge_documents
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
