-- Tabla para recibir registros de bitácora sincronizados desde la App Android
create table public.registros_app (
  id uuid default gen_random_uuid() primary key,
  site_name text not null,
  date text not null,
  weather text,
  crew_count integer,
  description text,
  physical_progress numeric,
  financial_progress numeric,
  budget_estimate numeric,
  latitude numeric,
  longitude numeric,
  photo_uri text,
  timestamp bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.registros_app enable row level security;

-- Políticas
create policy "Admins y Masters pueden leer y gestionar registros"
  on public.registros_app for all
  using (public.is_admin_or_master(auth.uid()));

create policy "La App puede insertar registros anónimamente o con su key"
  on public.registros_app for insert
  with check (true);
