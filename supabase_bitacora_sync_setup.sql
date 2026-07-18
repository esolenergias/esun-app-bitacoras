-- ====================================================
-- ESOL ENERGÍAS — BITÁCORA APP: SYNC SETUP
-- ====================================================
-- Ejecuta este script en Supabase → SQL Editor
-- No crea tablas nuevas — usa las existentes y agrega
-- las columnas faltantes + acceso anon para la app.
-- ====================================================

-- ----------------------------------------------------
-- PASO 1: Agregar columnas faltantes a presupuestos
-- (Las que pide la app de bitácora y aún no existen)
-- ----------------------------------------------------
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS ubicacion   text,
  ADD COLUMN IF NOT EXISTS inicio      date,
  ADD COLUMN IF NOT EXISTS termino     date,
  ADD COLUMN IF NOT EXISTS residente   text;

-- ----------------------------------------------------
-- PASO 2: Políticas de lectura para rol "anon"
-- (Permite que la app Android lea con la anon key)
-- ----------------------------------------------------

-- presupuestos
DROP POLICY IF EXISTS "Lectura publica presupuestos bitacora" ON public.presupuestos;
CREATE POLICY "Lectura publica presupuestos bitacora"
  ON public.presupuestos FOR SELECT
  USING (true);

-- presupuesto_conceptos
DROP POLICY IF EXISTS "Lectura publica conceptos bitacora" ON public.presupuesto_conceptos;
CREATE POLICY "Lectura publica conceptos bitacora"
  ON public.presupuesto_conceptos FOR SELECT
  USING (true);

-- matrices (APUs)
DROP POLICY IF EXISTS "Lectura publica matrices bitacora" ON public.matrices;
CREATE POLICY "Lectura publica matrices bitacora"
  ON public.matrices FOR SELECT
  USING (true);

-- ----------------------------------------------------
-- PASO 3: Vista de compatibilidad para la app bitácora
-- Mapea los nombres de columnas existentes a los que
-- espera la app (obra_name, cliente, etc.)
-- ----------------------------------------------------
CREATE OR REPLACE VIEW public.presupuestos_bitacora AS
SELECT
  p.id,
  p.name          AS obra_name,
  p.client_name   AS cliente,
  p.ubicacion,
  p.inicio,
  p.termino,
  p.residente,
  p.status,
  p.produccion,
  p.indirect_percentage,
  p.utility_percentage,
  p.created_at,
  p.updated_at
FROM public.presupuestos p;

GRANT SELECT ON public.presupuestos_bitacora TO anon;

-- Vista de conceptos con columnas mapeadas
CREATE OR REPLACE VIEW public.conceptos_bitacora AS
SELECT
  pc.id,
  pc.presupuesto_id,
  pc.description,
  pc.unit,
  pc.quantity,
  pc.cost_price       AS unit_price,
  pc.quantity * pc.cost_price AS total_budget,
  pc.indirect_percentage,
  pc.utility_percentage,
  pc.order_index,
  pc.type,
  pc.created_at,
  pc.updated_at
FROM public.presupuesto_conceptos pc;

GRANT SELECT ON public.conceptos_bitacora TO anon;

-- ----------------------------------------------------
-- PASO 4: Registro de prueba con produccion = true
-- ----------------------------------------------------
INSERT INTO public.presupuestos (
  name, client_name, status, produccion,
  ubicacion, inicio, termino, residente,
  indirect_percentage, utility_percentage
) VALUES (
  'Prueba Bitácora - Instalación Solar 30kW',
  'Cliente Demo S.A. de C.V.',
  'aprobado',
  true,
  'Av. Insurgentes 60A, Centro, Tepic, Nayarit',
  '2026-07-01',
  '2026-08-15',
  'Ing. Manuel Freyding',
  10.00,
  8.00
)
ON CONFLICT DO NOTHING;

-- ====================================================
-- VERIFICACIÓN — Ejecuta esto al final para confirmar
-- ====================================================
-- SELECT id, obra_name, cliente, status, produccion, ubicacion, inicio, termino, residente
-- FROM public.presupuestos_bitacora
-- ORDER BY created_at DESC LIMIT 5;
