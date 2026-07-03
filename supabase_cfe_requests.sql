-- ----------------------------------------------------
-- CFE REQUESTS TABLE (Interconnection Procedures)
-- ----------------------------------------------------
create table if not exists public.cfe_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'PENDING_DOCS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  carta_poder jsonb not null default '{}'::jsonb,
  unifilar jsonb not null default '{}'::jsonb,
  files jsonb not null default '{}'::jsonb
);

-- Enable RLS
alter table public.cfe_requests enable row level security;

-- Drop existing policies if they exist to prevent duplicates
drop policy if exists "Admins y Masters gestionan solicitudes CFE" on public.cfe_requests;
drop policy if exists "Lectura de solicitudes para usuarios autorizados" on public.cfe_requests;

-- Create Policies
create policy "Admins y Masters gestionan solicitudes CFE"
  on public.cfe_requests for all
  using (public.is_admin_or_master(auth.uid()));

-- Insert seed mock request
insert into public.cfe_requests (id, status, client, location, carta_poder, unifilar, files)
values (
  '8d9b62fb-2786-4e50-93a8-b64d12574e44',
  'PENDING_DOCS',
  '{
    "name": "Juan Pérez",
    "rpu": "123456789012",
    "address": "Av. Siempre Viva 742",
    "zipCode": "12345"
  }'::jsonb,
  '{
    "address": "Av. Siempre Viva 742, Springfield",
    "lat": 19.4326,
    "lng": -99.1332
  }'::jsonb,
  '{
    "grantedTo": "Esol S.A. de C.V.",
    "date": "2026-06-09"
  }'::jsonb,
  '{
    "panelBrand": "Trina Solar",
    "panelModel": "Vertex 550W",
    "panelPower": 550,
    "panelVoc": 49.6,
    "panelIsc": 14.0,
    "panelVmp": 41.2,
    "panelImp": 13.3,
    "inverterBrand": "Growatt",
    "inverterModel": "MIN 5000TL-X",
    "inverterPower": 5000,
    "inverterVmaxIn": 550,
    "inverterVminIn": 100,
    "inverterImaxIn": 13.5,
    "inverterImaxOut": 22.7,
    "inverterQuantity": 1,
    "panelsPerString": 10,
    "numberOfStrings": 1,
    "dcWireGauge": "10 AWG",
    "acWireGauge": "8 AWG",
    "acBreakerCapacity": 30,
    "mountingSolution": "Coplanar sobre techo de losa"
  }'::jsonb,
  '{}'::jsonb
) on conflict (id) do nothing;
