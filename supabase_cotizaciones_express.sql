-- ==============================================================================
-- TABLA: cotizaciones_express
-- Permite almacenar cotizaciones rápidas (borradores y emitidas con folio oficial)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cotizaciones_express (
    id TEXT PRIMARY KEY,
    folio TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'borrador', -- 'borrador' | 'emitido' | 'aprobada' | 'rechazada' | 'cancelada'
    fecha TEXT NOT NULL,
    vigencia_dias INTEGER NOT NULL DEFAULT 15,
    lugar TEXT DEFAULT 'Hermosillo, Sonora',
    cliente_id TEXT,
    cliente_nombre TEXT NOT NULL,
    cliente_rfc TEXT,
    cliente_contacto TEXT,
    cliente_telefono TEXT,
    cliente_correo TEXT,
    cliente_direccion TEXT,
    asunto TEXT NOT NULL,
    introduccion TEXT,
    partidas JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    iva_porcentaje NUMERIC NOT NULL DEFAULT 16,
    iva_monto NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    tiempo_entrega TEXT,
    forma_pago TEXT,
    garantia TEXT,
    notas_adicionales TEXT,
    emisor_nombre TEXT,
    emisor_cargo TEXT,
    emisor_telefono TEXT,
    emisor_correo TEXT,
    drive_file_id TEXT,
    drive_url TEXT,
    tesoreria_ingreso_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_cotizaciones_express_folio ON public.cotizaciones_express (folio);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_express_estado ON public.cotizaciones_express (estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_express_cliente ON public.cotizaciones_express (cliente_nombre);

-- Política de RLS (Row Level Security) abierta si usan anon key o restringida
ALTER TABLE public.cotizaciones_express ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir select para todos en cotizaciones_express"
ON public.cotizaciones_express FOR SELECT
USING (true);

CREATE POLICY "Permitir insert/update/delete en cotizaciones_express"
ON public.cotizaciones_express FOR ALL
USING (true)
WITH CHECK (true);
