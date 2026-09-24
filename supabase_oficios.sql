-- ============================================================
-- TABLA Y POLÍTICAS DE RLS PARA OFICIOS DE OBRA
-- ESOL ENERGIAS
-- ============================================================

create table if not exists public.oficios_obra (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  fecha date not null,
  lugar text default 'Tepic, Nayarit',
  presupuesto_id text,
  nombre_obra text,
  ubicacion_obra text,
  cliente_final text,
  tipo_oficio text default 'libre',
  
  -- Destinatario
  destinatario_titulo text,
  destinatario_nombre text not null,
  destinatario_cargo text,
  destinatario_empresa text,
  destinatario_atencion text,
  
  -- Contenido
  asunto text not null,
  referencia text,
  vocativo text,
  antecedentes text,
  cuerpo text not null,
  fundamentacion text,
  peticion text,
  despedida text,
  
  -- Remitente
  remitente_nombre text default 'Manuel de Jesus Fregoso Samaniega',
  remitente_cargo text default 'REPRESENTANTE LEGAL',
  remitente_cedula text,
  empresa_razon_social text default 'ESOL ENERGIAS',
  empresa_rfc text,
  empresa_domicilio text default 'Tepic, Nayarit, México',
  empresa_telefono text default '3112343034',
  empresa_email text default 'contacto@esolenergias.com',
  
  -- Listas y enlaces
  ccp jsonb default '[]'::jsonb,
  anexos jsonb default '[]'::jsonb,
  drive_url text,
  firma_digital text,
  incluir_firma_digital boolean default true,
  
  estado text default 'emitido',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para búsquedas ágiles
create index if not exists idx_oficios_folio on public.oficios_obra (folio);
create index if not exists idx_oficios_cliente on public.oficios_obra (cliente_final);
create index if not exists idx_oficios_presupuesto on public.oficios_obra (presupuesto_id);

-- Habilitar RLS
alter table public.oficios_obra enable row level security;

-- Política de acceso total para usuarios autenticados / app
drop policy if exists "Permitir todo en oficios_obra" on public.oficios_obra;
create policy "Permitir todo en oficios_obra"
  on public.oficios_obra for all
  using (true)
  with check (true);
