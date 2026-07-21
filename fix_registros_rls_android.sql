-- ====================================================
-- ESOL ENERGÍAS - FIX SINCRONIZACIÓN APP ANDROID
-- ====================================================
-- Este script permite que la aplicación de Android (que se conecta de forma anónima)
-- pueda leer y escribir reportes diarios en Supabase sin recibir error 401.

-- 1. Políticas para la tabla registros_app (Reportes diarios)
DROP POLICY IF EXISTS "Permitir insercion anonima desde app" ON public.registros_app;
DROP POLICY IF EXISTS "Permitir lectura anonima desde app" ON public.registros_app;
DROP POLICY IF EXISTS "Permitir update anonimo desde app" ON public.registros_app;

CREATE POLICY "Permitir insercion anonima desde app" 
  ON public.registros_app FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir lectura anonima desde app" 
  ON public.registros_app FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir update anonimo desde app" 
  ON public.registros_app FOR UPDATE 
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- 2. Asegurarnos que la tabla obras_app también permita inserciones y lecturas si no lo hace
DROP POLICY IF EXISTS "Permitir insercion anonima obras" ON public.obras_app;
DROP POLICY IF EXISTS "Permitir lectura anonima obras" ON public.obras_app;
DROP POLICY IF EXISTS "Permitir update anonimo obras" ON public.obras_app;

CREATE POLICY "Permitir insercion anonima obras" 
  ON public.obras_app FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir lectura anonima obras" 
  ON public.obras_app FOR SELECT 
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir update anonimo obras" 
  ON public.obras_app FOR UPDATE 
  TO anon, authenticated
  USING (true) WITH CHECK (true);
