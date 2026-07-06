-- ====================================================
-- ESOL ENERGÍAS - UPDATE PRESUPUESTOS TABLE FOR GLOBAL MARGINS
-- ====================================================
-- Description:
-- Adds indirect_percentage and utility_percentage to the public.presupuestos table.
-- Sets default values of 10.00% and 8.00% respectively.
-- Safe to re-run.

ALTER TABLE public.presupuestos 
ADD COLUMN IF NOT EXISTS indirect_percentage numeric(5, 2) NOT NULL DEFAULT 10.00 CHECK (indirect_percentage >= 0.00),
ADD COLUMN IF NOT EXISTS utility_percentage numeric(5, 2) NOT NULL DEFAULT 8.00 CHECK (utility_percentage >= 0.00);
