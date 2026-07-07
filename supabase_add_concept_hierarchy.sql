-- ====================================================
-- ESOL ENERGÍAS - COTIZADOR: Jerarquía de Conceptos (Dependencias)
-- ====================================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- Agrega soporte para agrupadores (dependencias/subdependencias) e insumos directos.

-- 1. Agregar columna parent_id y tipo a la tabla presupuesto_conceptos
ALTER TABLE public.presupuesto_conceptos
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.presupuesto_conceptos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'concept';

-- 2. Constraint para tipos válidos
ALTER TABLE public.presupuesto_conceptos
  DROP CONSTRAINT IF EXISTS presupuesto_conceptos_type_check;

ALTER TABLE public.presupuesto_conceptos
  ADD CONSTRAINT presupuesto_conceptos_type_check
  CHECK (type IN ('concept', 'group', 'insumo_directo'));

-- 3. Crear índice para acelerar las consultas jerárquicas
CREATE INDEX IF NOT EXISTS idx_presupuesto_conceptos_parent_id 
  ON public.presupuesto_conceptos (parent_id);

-- 4. Recargar el schema de PostgREST
NOTIFY pgrst, 'reload schema';
