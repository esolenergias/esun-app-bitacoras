-- ============================================================
-- TABLAS Y POLÍTICAS DE RLS PARA PÓLIZAS DE GARANTÍA Y MANTENIMIENTO
-- ESOL ENERGIAS
-- ============================================================

-- 1. Tabla Principal: polizas_garantia
create table if not exists public.polizas_garantia (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  presupuesto_id text,
  cliente_nombre text not null,
  cliente_direccion text,
  cliente_telefono text,
  cliente_email text,
  nombre_obra text not null,
  conceptos_incluidos jsonb not null default '[]'::jsonb,
  tipo_cobertura text default 'Mantenimiento Preventivo y Garantía de Servicio',
  periodicidad text not null default 'Trimestral',
  duracion_anos numeric default 1,
  fecha_inicio date not null,
  fecha_fin date not null,
  monto_total numeric default 0,
  monto_visita numeric default 0,
  estado text default 'activa', -- 'activa', 'completada', 'vencida', 'cancelada'
  terminos_legales text,
  observaciones text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla Secundaria: visitas_mantenimiento_poliza
create table if not exists public.visitas_mantenimiento_poliza (
  id uuid primary key default gen_random_uuid(),
  poliza_id uuid references public.polizas_garantia(id) on delete cascade not null,
  numero_visita integer not null,
  fecha_programada date not null,
  concepto_servicio text,
  estado text default 'pendiente', -- 'pendiente', 'programada', 'completada', 'reprogramada', 'cancelada'
  fecha_realizada date,
  tecnico_asignado text,
  notas_visita text,
  recordatorio_enviado boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.polizas_garantia enable row level security;
alter table public.visitas_mantenimiento_poliza enable row level security;

-- Crear políticas permisivas para acceso general de la aplicación
drop policy if exists "Permitir todo en polizas_garantia" on public.polizas_garantia;
create policy "Permitir todo en polizas_garantia"
  on public.polizas_garantia for all
  using (true)
  with check (true);

drop policy if exists "Permitir todo en visitas_mantenimiento_poliza" on public.visitas_mantenimiento_poliza;
create policy "Permitir todo en visitas_mantenimiento_poliza"
  on public.visitas_mantenimiento_poliza for all
  using (true)
  with check (true);

-- Índices para optimizar búsquedas por cliente, fecha y estado
create index if not exists idx_polizas_garantia_cliente on public.polizas_garantia (cliente_nombre);
create index if not exists idx_polizas_garantia_estado on public.polizas_garantia (estado);
create index if not exists idx_visitas_poliza_fecha on public.visitas_mantenimiento_poliza (fecha_programada);
create index if not exists idx_visitas_poliza_estado on public.visitas_mantenimiento_poliza (estado);
