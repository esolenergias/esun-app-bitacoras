-- ====================================================
-- ESOL ENERGÍAS - UPDATE MATRIZ_INSUMOS TABLE FOR FORMULAS
-- ====================================================
-- Description:
-- Adds formula column to the public.matriz_insumos table.
-- Allows storing mathematical formulas for dynamic yields.
-- Safe to re-run.

ALTER TABLE public.matriz_insumos 
ADD COLUMN IF NOT EXISTS formula text;
