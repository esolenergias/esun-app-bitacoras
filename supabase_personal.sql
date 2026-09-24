-- ============================================================
-- TABLAS Y POLÍTICAS DE RLS PARA MÓDULO PERSONAL (LEGAL ESOL)
-- ESOL ENERGÍAS - SOLUCIONES INTEGRALES DE NAYARIT S. DE R.L. DE C.V.
-- ============================================================

-- 1. Tabla de Trabajadores / Personal
create table if not exists public.personal_trabajadores (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  puesto text not null, -- Ej. Instalador Eléctrico, Técnico Solar, Ayudante, Supervisor
  telefono text,
  banco text, -- Ej. BBVA, Banorte, Santander, Azteca
  cuenta_clabe text, -- CLABE interbancaria (18 dígitos) o número de cuenta
  sueldo_base_semanal numeric default 0,
  curp text,
  rfc text,
  estado text default 'activo', -- 'activo', 'inactivo'
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Registros Semanales de Actividades y Liquidación
create table if not exists public.personal_registros_semanales (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  trabajador_id uuid references public.personal_trabajadores(id) on delete set null,
  trabajador_nombre text not null,
  trabajador_puesto text,
  trabajador_banco text,
  trabajador_clabe text,
  fecha_inicio date not null,
  fecha_fin date not null,
  numero_semana integer,
  ano integer,
  monto_base numeric default 0,
  monto_ajuste numeric default 0, -- Ajustes por imprevistos (+ bonos / - deducciones)
  motivo_ajuste text, -- Justificación del ajuste
  monto_total numeric default 0, -- monto_base + monto_ajuste
  estado_pago text default 'pendiente', -- 'pendiente', 'pagado', 'cancelado'
  fecha_pago date,
  metodo_pago text default 'Transferencia',
  resumen_semanal text, -- Resumen general de actividades de la semana
  observaciones text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.personal_trabajadores enable row level security;
alter table public.personal_registros_semanales enable row level security;

-- Políticas de acceso permisivas para la aplicación
drop policy if exists "Permitir todo en personal_trabajadores" on public.personal_trabajadores;
create policy "Permitir todo en personal_trabajadores"
  on public.personal_trabajadores for all
  using (true)
  with check (true);

drop policy if exists "Permitir todo en personal_registros_semanales" on public.personal_registros_semanales;
create policy "Permitir todo en personal_registros_semanales"
  on public.personal_registros_semanales for all
  using (true)
  with check (true);

-- Índices para búsquedas y filtros rápidos
create index if not exists idx_personal_trabajadores_nombre on public.personal_trabajadores (nombre_completo);
create index if not exists idx_personal_trabajadores_estado on public.personal_trabajadores (estado);
create index if not exists idx_personal_registros_trabajador on public.personal_registros_semanales (trabajador_id);
create index if not exists idx_personal_registros_periodo on public.personal_registros_semanales (fecha_inicio, fecha_fin);
create index if not exists idx_personal_registros_estado on public.personal_registros_semanales (estado_pago);
