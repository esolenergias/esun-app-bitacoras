-- supabase_monitoreo_fase4.sql

-- Tabla de Alertas de Monitoreo (IA)
CREATE TABLE IF NOT EXISTS public.esun_monitoring_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id UUID REFERENCES public.esun_pv_systems(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    ai_description TEXT NOT NULL,
    ai_recommendation TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE public.esun_monitoring_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access on monitoring_alerts" ON public.esun_monitoring_alerts;
CREATE POLICY "Allow authenticated full access on monitoring_alerts" 
ON public.esun_monitoring_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_esun_monitoring_alerts_system_id ON public.esun_monitoring_alerts (system_id);
CREATE INDEX IF NOT EXISTS idx_esun_monitoring_alerts_severity ON public.esun_monitoring_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_esun_monitoring_alerts_resolved ON public.esun_monitoring_alerts (is_resolved);
