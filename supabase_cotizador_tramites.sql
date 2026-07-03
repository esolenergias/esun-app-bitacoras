-- ====================================================
-- ESOL ENERGÍAS - COTIZADOR: Agregar Categoría de "Trámites" (service)
-- ====================================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- Modifica la validación del tipo de insumo y actualiza los conceptos creados.

-- 1. Eliminar la restricción de tipo anterior si existe
ALTER TABLE public.insumos 
  DROP CONSTRAINT IF EXISTS insumos_type_check;

-- 2. Crear la nueva restricción que admite el tipo 'service' (Trámites)
ALTER TABLE public.insumos 
  ADD CONSTRAINT insumos_type_check 
  CHECK (type IN ('material', 'labor', 'equipment', 'tool', 'service'));

-- 3. Actualizar el tipo de los insumos existentes de trámites a 'service'
-- Opcionalmente también actualizamos sus códigos de 'MAT-' a 'SRV-' para mayor orden
UPDATE public.insumos 
  SET type = 'service', code = 'SRV-IND-UVIE' 
  WHERE code = 'MAT-IND-UVIE';

UPDATE public.insumos 
  SET type = 'service', code = 'SRV-IND-TRAM' 
  WHERE code = 'MAT-IND-TRAM';

UPDATE public.insumos 
  SET type = 'service', code = 'SRV-IND-COM' 
  WHERE code = 'MAT-IND-COM';

-- 4. Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
