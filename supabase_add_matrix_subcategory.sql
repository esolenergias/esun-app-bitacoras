-- ====================================================
-- ESOL ENERGÍAS - COTIZADOR: Agregar Subcategorías de Matrices
-- ====================================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- Agrega la columna subcategory a la tabla matrices.
-- Es idempotente (seguro de ejecutar varias veces).

-- 1. Agregar columna subcategory con valor por defecto
ALTER TABLE public.matrices
  ADD COLUMN IF NOT EXISTS subcategory text DEFAULT 'Otros';

-- 2. Notificar a PostgREST para refrescar el schema cache
NOTIFY pgrst, 'reload schema';
