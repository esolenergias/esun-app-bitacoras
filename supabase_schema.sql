-- ====================================================
-- ESOL ENERGÍAS DATABASE SCHEMA & INITIAL SEED
-- ====================================================
-- Copy and paste this script directly into the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- to initialize all tables, triggers, RLS policies, and seed data.

-- ----------------------------------------------------
-- 1. ENUMS & EXTENSIONS
-- ----------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------
-- 2. PROFILES TABLE (Linked with auth.users)
-- ----------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text default 'user' check (role in ('user', 'admin', 'master')),
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- ----------------------------------------------------
-- RLS HELPER FUNCTIONS (security definer bypasses RLS within lookup queries)
-- ----------------------------------------------------
create or replace function public.is_admin_or_master(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where profiles.id = user_id and profiles.role in ('admin', 'master')
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_master(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where profiles.id = user_id and profiles.role = 'master'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Policies for Profiles using Helper Functions
create policy "Cualquiera puede leer perfiles"
  on public.profiles for select
  using (true);

create policy "Los usuarios pueden modificar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Solo Master/Admin puede realizar todas las operaciones en perfiles"
  on public.profiles for all
  using (public.is_admin_or_master(auth.uid()));

-- Trigger: Automatically create public profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case 
      when new.email = 'menyfre@gmail.com' or new.email like '%master%' then 'master'
      when new.email like '%admin%' then 'admin'
      else 'user'
    end,
    case 
      when new.email = 'menyfre@gmail.com' or new.email like '%master%' then '👑'
      when new.email like '%admin%' then '💼'
      else '☀️'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------
-- 3. CMS CONTENT TABLE (CMS & SEO configuration)
-- ----------------------------------------------------
create table public.cms_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on CMS Content
alter table public.cms_content enable row level security;

create policy "Cualquiera puede leer el contenido CMS y SEO"
  on public.cms_content for select
  using (true);

create policy "Solo Master puede modificar contenido CMS y SEO"
  on public.cms_content for all
  using (public.is_master(auth.uid()));

-- ----------------------------------------------------
-- 4. AI AGENTS TABLE
-- ----------------------------------------------------
create table public.ai_agents (
  id text primary key,
  name text not null,
  role text,
  status text check (status in ('active', 'inactive')) default 'active',
  system_prompt text,
  temperature numeric default 0.2,
  last_active text,
  logs jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on AI Agents
alter table public.ai_agents enable row level security;

create policy "Admins y Masters pueden leer y configurar agentes"
  on public.ai_agents for select
  using (public.is_admin_or_master(auth.uid()));

create policy "Solo Master puede modificar agentes"
  on public.ai_agents for all
  using (public.is_master(auth.uid()));



-- ----------------------------------------------------
-- 6. LEADS TABLE (Pipeline)
-- ----------------------------------------------------
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  tariff text,
  consumption text,
  panel_req text,
  status text default 'Pendiente 3D',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Leads
alter table public.leads enable row level security;

create policy "Admins y Masters pueden ver y gestionar leads"
  on public.leads for all
  using (public.is_admin_or_master(auth.uid()));

create policy "Clientes pueden registrar leads (por ejemplo a través de la calculadora)"
  on public.leads for insert
  with check (true);

-- ----------------------------------------------------
-- 7. CLIENT SOLAR PROJECTS TABLE
-- ----------------------------------------------------
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  client_email text not null,
  title text not null,
  address text,
  status_step integer default 1,
  shading_loss numeric default 0.0,
  optimized_tilt integer default 21,
  panel_count integer default 14,
  generation_today_kwh numeric default 0.0,
  savings_mxn numeric default 0.0,
  co2_tonnes numeric default 0.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Projects
alter table public.projects enable row level security;

create policy "Clientes ven sus propios proyectos"
  on public.projects for select
  using (
    client_email = (select email from public.profiles where profiles.id = auth.uid())
  );

create policy "Admins y Masters gestionan proyectos"
  on public.projects for all
  using (public.is_admin_or_master(auth.uid()));

-- ====================================================
-- SEED DATA
-- ====================================================

-- 1. CMS CONTENT
insert into public.cms_content (key, value) values (
  'landing_content',
  '{
    "promoBanner": {
      "active": true,
      "text": "¡OFERTA TEMPORAL: 15% de descuento en anteproyectos 3D para instaladores industriales y paneles LONGi!",
      "link": "#catalogo"
    },
    "hero": {
      "title": "PROYECTOS SOLARES DE PRECISIÓN",
      "subtitle": "Anteproyectos con fotomontaje 3D para instaladores que buscan cerrar más ventas, y distribución de componentes fotovoltaicos de primer nivel para todo México.",
      "statProjects": "150+",
      "statBrands": "15+",
      "statCapacity": "5 MW"
    },
    "promos": [
      {
        "id": "promo-1",
        "title": "Descuento B2B Primera Compra",
        "description": "Obtén un 5% de descuento adicional en tu primer palet de módulos fotovoltaicos LONGi Solar.",
        "discountCode": "ESOLFIRST5",
        "active": true
      },
      {
        "id": "promo-2",
        "title": "Anteproyecto 3D Exprés Gratis",
        "description": "Solicita un modelo 3D detallado de tu techumbre sin costo durante este mes para propuestas de más de 30kW.",
        "discountCode": "3DFREE2026",
        "active": true
      }
    ]
  }'::jsonb
) on conflict (key) do update set value = excluded.value;

-- 2. SEO DATA
insert into public.cms_content (key, value) values (
  'seo_data',
  '{
    "title": "eSol Energías | Distribución Solar y Anteproyectos 3D en México",
    "metaDescription": "eSol Energías distribuye paneles LONGi, Jinko, inversores Solis y ofrece anteproyectos interactivos 3D fotorrealistas con dron para instaladores solares.",
    "keywords": "paneles solares, distribuidor solar mexico, anteproyecto 3d solar, longi solar mexico, inversores solis, ingenieria solar",
    "googleAnalyticsId": "G-ESOL2026XX",
    "sitemapUrl": "https://esolenergias.com/sitemap.xml",
    "robotsTxt": "User-agent: *\\nAllow: /\\n\\nSitemap: https://esolenergias.com/sitemap.xml",
    "pageSpeedScore": {
      "performance": 98,
      "seo": 100,
      "accessibility": 96,
      "bestPractices": 100
    }
  }'::jsonb
) on conflict (key) do update set value = excluded.value;

insert into public.ai_agents (id, name, role, status, system_prompt, temperature, last_active, logs) values 
(
  'agent-1',
  'Carlos',
  'Asesor Solar',
  'active',
  'Eres Carlos, el asesor solar experto de eSol Energías. Tu objetivo es ayudar a los visitantes a resolver todas sus dudas sobre paneles solares, inversores, estructuras y proyectos de ingeniería 3D, y brindar estimaciones de precios rápidos de forma directa y profesional.

Tu tono es intermedio: amigable, profesional, confiable y muy cercano (tutea al cliente con calidez, usando frases como "cómo estás", "platícame", "con gusto", "estoy a tus órdenes", de forma corta y natural).

REGLAS DE OPERACIÓN:
- NUNCA menciones que eres una IA, un bot o un asistente virtual. Eres Carlos, asesor de eSol.
- Responde con total seguridad a preguntas técnicas de ingeniería o instalación (sombras, inclinación, compatibilidad de inversores o estructuras).
- Si el cliente te pide precios, cotizaciones o descuentos por volumen, realiza el cálculo correspondiente de inmediato y bríndaselo con gusto de forma clara.
- EVITA estar preguntando o presionando por los datos del cliente (nombre, WhatsApp, correo, etc.) a lo largo de la conversación, ya que se vuelve invasivo. Resuelve todas sus dudas técnicas primero.
- SOLO AL FINAL, para enviarle la cotización formal o algún cálculo detallado en PDF, le pedirás sus datos de contacto (nombre y WhatsApp).
- Si el cliente hace una pregunta de seguimiento tras darle un precio, contéstale directamente sin volver a pedirle el WhatsApp en esa misma respuesta.
- Si sigue sin querer proporcionar sus datos (si dice "no quiero", "por qué", "mándalo por aquí", etc.), pídeselo de manera sutil y educada, explicando que lo necesitas para generar la cotización formal en PDF en el sistema.
- Si ya proporcionó su WhatsApp (un número de 8-15 dígitos), agradécele cálidamente y confírmale que le enviaremos el archivo de inmediato.

DATOS DE eSol Energías:
- Ubicación: Insurgentes 60A, Centro, Tepic, Nayarit.
- Teléfono / WhatsApp oficial de eSol: 3112343034
- Correo: energiasesol@gmail.com
- Servicios: Distribución B2B y diseño 3D con dron para simulación de sombras.

LISTA DE PRECIOS B2B (Usa esto para calcular estimaciones):
1. Paneles Solares:
   - JA Solar 550W PERC: $2,800 unitario. Mayoreo (11+): $2,650, Distribuidor (30+): $2,480.
   - Znshine 450W Bifacial: $2,200 unitario. Mayoreo (11+): $2,080, Distribuidor (30+): $1,950.
2. Inversores de cadena:
   - Solis 10kW Trifásico 220V: $18,500. Volumen (4+): $17,400, Distribuidor (10+): $16,200.
   - Fronius Primo 5kW Monofásico: $24,500. Volumen (4+): $23,200, Distribuidor (10+): $21,800.
3. Microinversores (Hoymiles/Deye):
   - Hoymiles HM-1500 (4 entradas): $6,200. Volumen (6+): $5,850, Distribuidor (16+): $5,450.
   - Deye SUN-2000G3: $5,800. Volumen (6+): $5,480, Distribuidor (16+): $5,120.
4. Estructuras (Everest K2 / Aluminext):
   - Kit Aluminext 4 Paneles: $2,400. Mayoreo (6+): $2,250, Distribuidor (16+): $2,100.
   - K2 MiniRail Kit 2 Paneles (Alemana): $1,650. Mayoreo (6+): $1,550, Distribuidor (16+): $1,420.
5. Cable Solar: Rollo Cable 10 AWG (100m) negro: $2,950.
6. Baterías: Litio Pylontech US3000C 3.5kWh: $28,000.

Al final de tu respuesta, añade SIEMPRE una sección de metadatos delimitada exactamente por [METADATA] con los datos que hayas extraído de la conversación hasta ahora. Si algún dato no se conoce, déjalo en blanco. Usa exactamente este formato al final:

[METADATA]
Nombre: <nombre del cliente o vacío>
Teléfono: <número de teléfono/WhatsApp o vacío>
Detalle: <breve detalle de componentes o vacío>
Monto: <monto total aproximado en MXN, ej. $4,800 o vacío>',
  0.2,
  'Hace 1 minuto',
  '[
    "[11:20:10] Carlos inicializado.",
    "[11:21:45] Carlos operando en modo directo."
  ]'::jsonb
)
on conflict (id) do update set 
  name = excluded.name, role = excluded.role, status = excluded.status, 
  system_prompt = excluded.system_prompt, temperature = excluded.temperature, 
  last_active = excluded.last_active, logs = excluded.logs;

-- 5. LEADS
insert into public.leads (name, email, tariff, consumption, panel_req, status) values 
('Carlos Delgado', 'cliente.esol@gmail.com', 'PDBT (Comercial)', '1,420 kWh bimestrales', '14 módulos 550W', 'Activo'),
('Alfonso Gómez', 'alfonso@gmail.com', 'GDMTO (Industrial)', '12,450 kWh bimestrales', '118 módulos 550W', 'Pendiente 3D');

-- 6. CLIENT PROJECTS
insert into public.projects (client_email, title, address, status_step, shading_loss, optimized_tilt, panel_count, generation_today_kwh, savings_mxn, co2_tonnes) values
('cliente.esol@gmail.com', 'Residencia Delgado', 'Guadalajara, Jalisco', 3, 2.8, 21, 14, 42.8, 18450.0, 1.2);
