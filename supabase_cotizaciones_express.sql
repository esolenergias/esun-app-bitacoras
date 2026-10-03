-- ==============================================================================
-- ACTUALIZACIÓN DE TABLA: cotizaciones_express
-- Agrega soporte para estructura formal de 3 hojas (Condiciones de Servicio y Trabajo)
-- ==============================================================================

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.cotizaciones_express (
    id TEXT PRIMARY KEY,
    folio TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'borrador', -- 'borrador' | 'emitido' | 'aprobada' | 'rechazada' | 'cancelada'
    fecha TEXT NOT NULL,
    vigencia_dias INTEGER NOT NULL DEFAULT 15,
    lugar TEXT DEFAULT 'Tepic, Nayarit',
    cliente_id TEXT,
    cliente_nombre TEXT NOT NULL,
    cliente_rfc TEXT,
    cliente_atencion TEXT,
    cliente_telefono TEXT,
    cliente_email TEXT,
    cliente_direccion TEXT,
    asunto TEXT NOT NULL,
    vocativo TEXT,
    tipo_servicio TEXT,
    descripcion_alcance TEXT,
    condiciones_servicio TEXT,
    metodologia_servicio TEXT,
    condiciones_trabajo TEXT,
    responsabilidades_cliente TEXT,
    exclusiones_garantias TEXT,
    partidas JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    descuento NUMERIC NOT NULL DEFAULT 0,
    iva_porcentaje NUMERIC NOT NULL DEFAULT 16,
    iva_monto NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    total_letras TEXT,
    tiempo_entrega TEXT,
    condiciones_pago TEXT,
    banco_receptor TEXT,
    cuenta_clabe TEXT,
    notas_comerciales TEXT,
    remitente_nombre TEXT,
    remitente_cargo TEXT,
    remitente_telefono TEXT,
    remitente_email TEXT,
    incluir_firma_digital BOOLEAN DEFAULT true,
    drive_file_id TEXT,
    drive_url TEXT,
    pdf_url TEXT,
    fecha_emision TEXT,
    fecha_aprobacion TEXT,
    ingreso_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Asegurar que las columnas nuevas existan si la tabla ya había sido creada previamente
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS cliente_atencion TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS vocativo TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS tipo_servicio TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS descripcion_alcance TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS condiciones_servicio TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS metodologia_servicio TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS condiciones_trabajo TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS responsabilidades_cliente TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS exclusiones_garantias TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS descuento NUMERIC DEFAULT 0;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS total_letras TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS condiciones_pago TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS banco_receptor TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS cuenta_clabe TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS notas_comerciales TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS remitente_nombre TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS remitente_cargo TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS remitente_telefono TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS remitente_email TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS incluir_firma_digital BOOLEAN DEFAULT true;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS fecha_emision TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS fecha_aprobacion TEXT;
ALTER TABLE public.cotizaciones_express ADD COLUMN IF NOT EXISTS ingreso_id TEXT;

-- 3. Índices recomendados
CREATE INDEX IF NOT EXISTS idx_cotizaciones_express_folio ON public.cotizaciones_express (folio);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_express_estado ON public.cotizaciones_express (estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_express_cliente ON public.cotizaciones_express (cliente_nombre);

-- 4. RLS
ALTER TABLE public.cotizaciones_express ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cotizaciones_express' AND policyname = 'Permitir select para todos en cotizaciones_express'
  ) THEN
    CREATE POLICY "Permitir select para todos en cotizaciones_express"
    ON public.cotizaciones_express FOR SELECT
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cotizaciones_express' AND policyname = 'Permitir all para todos en cotizaciones_express'
  ) THEN
    CREATE POLICY "Permitir all para todos en cotizaciones_express"
    ON public.cotizaciones_express FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;
