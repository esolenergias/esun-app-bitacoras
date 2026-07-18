-- ====================================================
-- ESOL ENERGÍAS - ADD PRODUCCION COLUMN TO PRESUPUESTOS
-- ====================================================
-- Description:
-- Adds a 'produccion' column to the public.presupuestos table.
-- This boolean flag marks whether a budget has been sent to production.
-- Defaults to FALSE (not in production).
-- Safe to re-run (uses IF NOT EXISTS).
-- Run this in the Supabase SQL Editor.
-- ====================================================

ALTER TABLE public.presupuestos
ADD COLUMN IF NOT EXISTS produccion boolean NOT NULL DEFAULT false;

-- Optional: Create an index for filtering by produccion status
CREATE INDEX IF NOT EXISTS idx_presupuestos_produccion ON public.presupuestos (produccion);

-- ====================================================
-- VERIFICATION QUERY — Run after migration to confirm
-- ====================================================
-- SELECT id, name, client_name, status, produccion, created_at
-- FROM public.presupuestos
-- ORDER BY created_at DESC
-- LIMIT 10;
