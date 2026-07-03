-- ====================================================
-- ESOL ENERGÍAS - COTIZADOR: Agregar Subcategorías de Materiales
-- ====================================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- Agrega la columna subcategory a la tabla insumos.
-- Es idempotente (seguro de ejecutar varias veces).

-- 1. Agregar columna subcategory (nullable para tipos que no son material)
ALTER TABLE public.insumos
  ADD COLUMN IF NOT EXISTS subcategory text DEFAULT NULL;

-- 2. Constraint: solo valores válidos permitidos
ALTER TABLE public.insumos
  DROP CONSTRAINT IF EXISTS insumos_subcategory_check;

ALTER TABLE public.insumos
  ADD CONSTRAINT insumos_subcategory_check
  CHECK (
    subcategory IS NULL OR subcategory IN (
      'Panel solar',
      'Inversor',
      'Estructura de montaje',
      'Estructura PTR',
      'Material electrico DC',
      'Material electrico AC'
    )
  );

-- 3. Actualizar insumos de seed existentes con su subcategoría correcta
UPDATE public.insumos SET subcategory = 'Panel solar'         WHERE code = 'MAT-PANEL-550';
UPDATE public.insumos SET subcategory = 'Estructura de montaje' WHERE code = 'MAT-ESTR-COP';
UPDATE public.insumos SET subcategory = 'Material electrico DC' WHERE code = 'MAT-CABL-10';
UPDATE public.insumos SET subcategory = 'Material electrico DC' WHERE code = 'MAT-MC4';

-- 4. Notificar a PostgREST para refrescar el schema cache
NOTIFY pgrst, 'reload schema';
