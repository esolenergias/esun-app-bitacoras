-- ====================================================
-- ESOL ENERGÍAS RLS RECURSION FIX
-- ====================================================
-- Copy and paste this script directly into the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- and run it to fix the infinite recursion RLS issue.

-- 1. Drop existing recursive policies on profiles
drop policy if exists "Cualquiera puede leer perfiles básicos" on public.profiles;
drop policy if exists "Los usuarios pueden actualizar su propio perfil" on public.profiles;
drop policy if exists "Solo Master/Admin puede crear o eliminar perfiles" on public.profiles;

-- 2. Create RLS Helper Functions (security definer bypasses RLS checks within the lookup)
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

-- 3. Recreate Profiles policies
create policy "Cualquiera puede leer perfiles"
  on public.profiles for select
  using (true);

create policy "Los usuarios pueden modificar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Solo Master/Admin puede realizar todas las operaciones en perfiles"
  on public.profiles for all
  using (public.is_admin_or_master(auth.uid()));

-- 4. Clean and update other tables' policies to use helper functions (safer and cleaner)
drop policy if exists "Solo Master puede modificar contenido CMS y SEO" on public.cms_content;
create policy "Solo Master puede modificar contenido CMS y SEO"
  on public.cms_content for all
  using (public.is_master(auth.uid()));

drop policy if exists "Solo Master puede modificar agentes" on public.ai_agents;
create policy "Solo Master puede modificar agentes"
  on public.ai_agents for all
  using (public.is_master(auth.uid()));

drop policy if exists "Solo Masters pueden ver agentes Pro" on public.pro_agents;
create policy "Solo Masters pueden ver agentes Pro"
  on public.pro_agents for select
  using (public.is_master(auth.uid()));

drop policy if exists "Solo Masters pueden interactuar con tareas Pro" on public.pro_agent_tasks;
create policy "Solo Masters pueden interactuar con tareas Pro"
  on public.pro_agent_tasks for all
  using (public.is_master(auth.uid()));

drop policy if exists "Admins y Masters pueden ver y gestionar leads" on public.leads;
create policy "Admins y Masters pueden ver y gestionar leads"
  on public.leads for all
  using (public.is_admin_or_master(auth.uid()));

drop policy if exists "Admins y Masters gestionan proyectos" on public.projects;
create policy "Admins y Masters gestionan proyectos"
  on public.projects for all
  using (public.is_admin_or_master(auth.uid()));
