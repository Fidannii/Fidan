-- OpsFlow AI seed for Nordblick demo tenant (run after schema.sql)
-- Fixed UUIDs so OPSFLOW_DEFAULT_ORG_ID can be set stably in .env

insert into public.organizations (id, name, slug, phone_number, timezone, recording_consent_enabled)
values (
  '11111111-1111-1111-1111-111111111111',
  'Nordblick Immobilien',
  'nordblick',
  '+49 40 1234567',
  'Europe/Berlin',
  true
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  phone_number = excluded.phone_number;

insert into public.agents (
  id,
  organization_id,
  name,
  vertical,
  voice_id,
  system_prompt,
  phone_number,
  status,
  retell_agent_id
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Sarah – Inbound Qualifizierung',
  'real_estate',
  'eleven_labs_sarah',
  'Du bist Sarah, die KI-Telefonassistentin von Nordblick Immobilien. Siehe App-Prompt realEstateAgent.ts für die kanonische Version.',
  '+49 40 9876543',
  'live',
  'retell_demo_agent'
)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  phone_number = excluded.phone_number;
