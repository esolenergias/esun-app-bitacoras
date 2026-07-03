-- ====================================================
-- ESOL ENERGÍAS - COTIZADOR SQL SETUP
-- ====================================================
-- Dependencies:
-- This script requires that 'supabase_schema.sql' is executed
-- first, as it relies on the 'public.profiles' table and the
-- RLS helper function 'public.is_admin_or_master(auth.uid())'.
--
-- Description:
-- This migration script creates the database schema, enables Row Level Security (RLS),
-- defines access control policies, configures timestamp triggers, and inserts seed data.
-- All operations are wrapped in a transaction block to ensure atomic execution.

BEGIN;

-- ----------------------------------------------------
-- 1. TABLE CREATION & INDEXES
-- ----------------------------------------------------

-- 1.1 Table: insumos
CREATE TABLE IF NOT EXISTS public.insumos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('material', 'labor', 'equipment', 'tool')),
  description text NOT NULL,
  unit text NOT NULL,
  cost numeric(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0.00),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 1.2 Table: matrices
CREATE TABLE IF NOT EXISTS public.matrices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  unit text NOT NULL,
  indirect_percentage numeric(5, 2) NOT NULL DEFAULT 10.00 CHECK (indirect_percentage >= 0.00),
  utility_percentage numeric(5, 2) NOT NULL DEFAULT 8.00 CHECK (utility_percentage >= 0.00),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 1.3 Table: matriz_insumos
CREATE TABLE IF NOT EXISTS public.matriz_insumos (
  matriz_id uuid REFERENCES public.matrices(id) ON DELETE CASCADE,
  insumo_id uuid REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantity numeric(12, 6) NOT NULL DEFAULT 0.000000 CHECK (quantity >= 0.000000),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (matriz_id, insumo_id)
);

-- 1.4 Table: presupuestos
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  client_name text NOT NULL,
  status text NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'enviado', 'aprobado', 'rechazado')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 1.5 Table: presupuesto_conceptos (with snapshot columns for historical preservation)
CREATE TABLE IF NOT EXISTS public.presupuesto_conceptos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  matriz_id uuid REFERENCES public.matrices(id) ON DELETE SET NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 0.00 CHECK (quantity >= 0.00),
  description text NOT NULL,
  unit text NOT NULL,
  cost_price numeric(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0.00),
  indirect_percentage numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (indirect_percentage >= 0.00),
  utility_percentage numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (utility_percentage >= 0.00),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 1.6 Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_matriz_insumos_insumo_id ON public.matriz_insumos (insumo_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_conceptos_presupuesto_id ON public.presupuesto_conceptos (presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_conceptos_matriz_id ON public.presupuesto_conceptos (matriz_id);

-- ----------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------

-- Enable RLS on all 5 tables
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriz_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto_conceptos ENABLE ROW LEVEL SECURITY;

-- 2.1 Policies for insumos
DROP POLICY IF EXISTS "Admins y Masters pueden realizar todas las operaciones en insumos" ON public.insumos;
CREATE POLICY "Admins y Masters pueden realizar todas las operaciones en insumos"
  ON public.insumos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- 2.2 Policies for matrices
DROP POLICY IF EXISTS "Admins y Masters pueden realizar todas las operaciones en matrices" ON public.matrices;
CREATE POLICY "Admins y Masters pueden realizar todas las operaciones en matrices"
  ON public.matrices FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- 2.3 Policies for matriz_insumos
DROP POLICY IF EXISTS "Admins y Masters pueden realizar todas las operaciones en matriz_insumos" ON public.matriz_insumos;
CREATE POLICY "Admins y Masters pueden realizar todas las operaciones en matriz_insumos"
  ON public.matriz_insumos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- 2.4 Policies for presupuestos
DROP POLICY IF EXISTS "Admins y Masters pueden realizar todas las operaciones en presupuestos" ON public.presupuestos;
CREATE POLICY "Admins y Masters pueden realizar todas las operaciones en presupuestos"
  ON public.presupuestos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- 2.5 Policies for presupuesto_conceptos
DROP POLICY IF EXISTS "Admins y Masters pueden realizar todas las operaciones en presupuesto_conceptos" ON public.presupuesto_conceptos;
CREATE POLICY "Admins y Masters pueden realizar todas las operaciones en presupuesto_conceptos"
  ON public.presupuesto_conceptos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- ----------------------------------------------------
-- 3. TIMESTAMP TRIGGERS
-- ----------------------------------------------------

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to automatically update the updated_at column when a row changes
CREATE OR REPLACE TRIGGER update_insumos_updated_at
  BEFORE UPDATE ON public.insumos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_matrices_updated_at
  BEFORE UPDATE ON public.matrices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_matriz_insumos_updated_at
  BEFORE UPDATE ON public.matriz_insumos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_presupuesto_conceptos_updated_at
  BEFORE UPDATE ON public.presupuesto_conceptos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------
-- 4. SEED DATA
-- ----------------------------------------------------

-- 4.1 Insert Insumos (Materiales, Mano de Obra, Herramientas)
INSERT INTO public.insumos (code, type, description, unit, cost) VALUES
  ('MAT-PANEL-550', 'material', 'Panel Solar Monocristalino 550W', 'pza', 2400.00),
  ('MAT-ESTR-COP', 'material', 'Estructura Coplanar de Aluminio 4P', 'pza', 1200.00),
  ('MAT-CABL-10', 'material', 'Cable Fotovoltaico 10 AWG Negro', 'm', 18.00),
  ('MAT-MC4', 'material', 'Conectores MC4 Par', 'par', 45.00),
  ('MO-CUAD-SOL', 'labor', 'Cuadrilla de Instalación Solar (1 Oficial + 1 Ayudante)', 'jor', 1500.00),
  ('EQ-HERR-MEN', 'tool', 'Herramienta menor (% de mano de obra)', '%', 0.05)
ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  cost = EXCLUDED.cost,
  updated_at = now();

-- 4.2 Insert Matrices (Unit Price Analyses - APUs)
INSERT INTO public.matrices (code, description, unit, indirect_percentage, utility_percentage) VALUES
  ('APU-PANEL-550', 'Suministro e instalación de panel solar 550W en estructura coplanar', 'pza', 10.00, 8.00)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  indirect_percentage = EXCLUDED.indirect_percentage,
  utility_percentage = EXCLUDED.utility_percentage,
  updated_at = now();

-- 4.3 Insert Matriz Insumos (Desglose / breakdown for APU-PANEL-550 concept)
INSERT INTO public.matriz_insumos (matriz_id, insumo_id, quantity)
VALUES
  (
    (SELECT id FROM public.matrices WHERE code = 'APU-PANEL-550'),
    (SELECT id FROM public.insumos WHERE code = 'MAT-PANEL-550'),
    1.000000
  ),
  (
    (SELECT id FROM public.matrices WHERE code = 'APU-PANEL-550'),
    (SELECT id FROM public.insumos WHERE code = 'MAT-ESTR-COP'),
    0.250000
  ),
  (
    (SELECT id FROM public.matrices WHERE code = 'APU-PANEL-550'),
    (SELECT id FROM public.insumos WHERE code = 'MAT-CABL-10'),
    6.000000
  ),
  (
    (SELECT id FROM public.matrices WHERE code = 'APU-PANEL-550'),
    (SELECT id FROM public.insumos WHERE code = 'MAT-MC4'),
    1.000000
  ),
  (
    (SELECT id FROM public.matrices WHERE code = 'APU-PANEL-550'),
    (SELECT id FROM public.insumos WHERE code = 'MO-CUAD-SOL'),
    0.125000
  )
ON CONFLICT (matriz_id, insumo_id) DO UPDATE SET
  quantity = EXCLUDED.quantity;

COMMIT;
