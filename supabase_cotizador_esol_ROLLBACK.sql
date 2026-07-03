-- ====================================================
-- ESOL ENERGÍAS - COTIZADOR ROLLBACK / CLEANUP
-- ====================================================
-- Ejecuta este script en la cuenta INCORRECTA de Supabase
-- para borrar todos los cambios del Cotizador Esol.
-- ⚠️ ESTO ES IRREVERSIBLE — asegúrate de estar en la cuenta correcta.
-- ====================================================

-- ----------------------------------------------------
-- 1. ELIMINAR TRIGGERS
-- ----------------------------------------------------
DROP TRIGGER IF EXISTS update_presupuesto_conceptos_updated_at ON public.presupuesto_conceptos;
DROP TRIGGER IF EXISTS update_presupuestos_updated_at ON public.presupuestos;
DROP TRIGGER IF EXISTS update_matriz_insumos_updated_at ON public.matriz_insumos;
DROP TRIGGER IF EXISTS update_matrices_updated_at ON public.matrices;
DROP TRIGGER IF EXISTS update_insumos_updated_at ON public.insumos;

-- ----------------------------------------------------
-- 2. ELIMINAR ÍNDICES
-- ----------------------------------------------------
DROP INDEX IF EXISTS public.idx_presupuesto_conceptos_matriz_id;
DROP INDEX IF EXISTS public.idx_presupuesto_conceptos_presupuesto_id;
DROP INDEX IF EXISTS public.idx_matriz_insumos_insumo_id;

-- ----------------------------------------------------
-- 3. ELIMINAR TABLAS (en orden para respetar FK)
-- ----------------------------------------------------
DROP TABLE IF EXISTS public.presupuesto_conceptos CASCADE;
DROP TABLE IF EXISTS public.presupuesto_insumos CASCADE;
DROP TABLE IF EXISTS public.matriz_insumos CASCADE;
DROP TABLE IF EXISTS public.presupuestos CASCADE;
DROP TABLE IF EXISTS public.matrices CASCADE;
DROP TABLE IF EXISTS public.insumos CASCADE;

-- ----------------------------------------------------
-- 4. ELIMINAR FUNCIONES (solo si no las usa otro módulo)
-- ----------------------------------------------------
-- ⚠️ Solo eliminar is_admin_or_master si NO viene de supabase_schema.sql
-- Comenta esta línea si la función es compartida con el resto del sistema:
-- DROP FUNCTION IF EXISTS public.is_admin_or_master(uuid);

DROP FUNCTION IF EXISTS public.update_updated_at_column();
