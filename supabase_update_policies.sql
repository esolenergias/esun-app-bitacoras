-- ====================================================
-- ESOL ENERGÍAS DATABASE POLICIES UPDATE
-- ====================================================
-- Copia y pega este script en el editor SQL de tu panel de Supabase
-- (Dashboard > SQL Editor > New query) y ejecútalo para actualizar las políticas de seguridad.
-- Esto habilitará el funcionamiento sincronizado global de productos, agentes y contenido CMS.

-- 1. Actualizar política de lectura (SELECT) para ai_agents para que sea pública
-- Esto permite que cualquier visitante que abra la web pueda cargar el prompt del asesor Carlos.
drop policy if exists "Admins y Masters pueden leer y configurar agentes" on public.ai_agents;
create policy "Cualquiera puede leer agentes de IA"
  on public.ai_agents for select
  using (true);

-- 2. Actualizar política de escritura para ai_agents para que tanto Admins como Masters puedan modificar
drop policy if exists "Solo Master puede modificar agentes" on public.ai_agents;
create policy "Admins y Masters pueden modificar agentes"
  on public.ai_agents for all
  using (public.is_admin_or_master(auth.uid()));

-- 3. Actualizar política de escritura de cms_content para permitir a Admins y Masters
-- Esto permite que los productos, el contenido y los SEO se editen por ambos roles.
drop policy if exists "Solo Master puede modificar contenido CMS y SEO" on public.cms_content;
create policy "Admins y Masters pueden modificar contenido CMS y SEO"
  on public.cms_content for all
  using (public.is_admin_or_master(auth.uid()));
