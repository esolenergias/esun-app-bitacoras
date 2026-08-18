-- supabase_monitoreo_fase3.sql

-- Tabla de Logs de Producción
CREATE TABLE IF NOT EXISTS public.esun_production_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id UUID REFERENCES public.esun_pv_systems(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    generated_kwh NUMERIC NOT NULL DEFAULT 0,
    estimated_consumption_kwh NUMERIC DEFAULT 0,
    status_code TEXT, -- e.g., 'OK', 'COMM_ERROR', 'INVERTER_FAULT'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_production_system_date UNIQUE (system_id, date)
);

-- Habilitar RLS
ALTER TABLE public.esun_production_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access on production_logs" ON public.esun_production_logs;
CREATE POLICY "Allow authenticated full access on production_logs" 
ON public.esun_production_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_esun_production_logs_system_id ON public.esun_production_logs (system_id);
CREATE INDEX IF NOT EXISTS idx_esun_production_logs_date ON public.esun_production_logs (date);
