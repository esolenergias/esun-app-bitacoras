# Especificación de Diseño: Cotizador Esol (Sistema de Precios Unitarios)

Este documento define la especificación técnica y de diseño para el **Cotizador Esol**, una herramienta interna basada en matrices de conceptos (Análisis de Precios Unitarios o APU), similar a OPUS o Neodata, integrada en el portal de administración para roles `admin` y `master`.

---

## 1. Modelo de Datos (SQL - Supabase)

El sistema utilizará 5 tablas principales. El acceso de lectura y escritura estará protegido por Políticas de Seguridad de Fila (RLS) limitadas a roles `admin` y `master`.

```sql
-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLA DE INSUMOS (CATÁLOGO MAESTRO)
-- ==========================================
CREATE TABLE public.insumos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('material', 'labor', 'equipment', 'tool')),
  description text NOT NULL,
  unit text NOT NULL,
  cost numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y Masters gestionan insumos"
  ON public.insumos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- ==========================================
-- 2. TABLA DE MATRICES (APUs)
-- ==========================================
CREATE TABLE public.matrices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  unit text NOT NULL,
  indirect_percentage numeric(5, 2) NOT NULL DEFAULT 10.00,
  utility_percentage numeric(5, 2) NOT NULL DEFAULT 8.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.matrices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y Masters gestionan matrices"
  ON public.matrices FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- ==========================================
-- 3. TABLA DE RELACIÓN MATRIZ-INSUMO (DESGLOSE APU)
-- ==========================================
CREATE TABLE public.matriz_insumos (
  matriz_id uuid REFERENCES public.matrices(id) ON DELETE CASCADE,
  insumo_id uuid REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantity numeric(12, 6) NOT NULL DEFAULT 0.000000,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (matriz_id, insumo_id)
);

-- Habilitar RLS
ALTER TABLE public.matriz_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y Masters gestionan desglose de matrices"
  ON public.matriz_insumos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- ==========================================
-- 4. TABLA DE PRESUPUESTOS (PROYECTOS)
-- ==========================================
CREATE TABLE public.presupuestos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  client_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('borrador', 'enviado', 'aprobado', 'rechazado')) DEFAULT 'borrador',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y Masters gestionan presupuestos"
  ON public.presupuestos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));

-- ==========================================
-- 5. CONCEPTOS DE PRESUPUESTO (PARTIDAS DE OBRA)
-- ==========================================
CREATE TABLE public.presupuesto_conceptos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  matriz_id uuid REFERENCES public.matrices(id) ON DELETE SET NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.presupuesto_conceptos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y Masters gestionan conceptos de presupuestos"
  ON public.presupuesto_conceptos FOR ALL
  USING (public.is_admin_or_master(auth.uid()));
