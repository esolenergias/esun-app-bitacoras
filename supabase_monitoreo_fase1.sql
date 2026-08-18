-- supabase_monitoreo_fase1.sql

-- Tabla de Cuentas de Inversores
CREATE TABLE IF NOT EXISTS public.esun_inverter_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID,
    brand TEXT NOT NULL CHECK (brand IN ('Huawei', 'Growatt', 'Hoymiles')),
    username TEXT NOT NULL,
    encrypted_password TEXT,
    api_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Sistemas Fotovoltaicos
CREATE TABLE IF NOT EXISTS public.esun_pv_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.esun_inverter_accounts(id) ON DELETE CASCADE,
    plant_id TEXT NOT NULL,
    plant_name TEXT NOT NULL,
    capacity_kwp NUMERIC NOT NULL,
    cfe_tariff TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_pv_systems_account_plant UNIQUE (account_id, plant_id)
);

-- Habilitar RLS
ALTER TABLE public.esun_inverter_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esun_pv_systems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access on inverter_accounts" ON public.esun_inverter_accounts;
CREATE POLICY "Allow authenticated full access on inverter_accounts" 
ON public.esun_inverter_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pv_systems" ON public.esun_pv_systems;
CREATE POLICY "Allow authenticated full access on pv_systems" 
ON public.esun_pv_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_esun_pv_systems_account_id ON public.esun_pv_systems (account_id);
CREATE INDEX IF NOT EXISTS idx_esun_pv_systems_plant_id ON public.esun_pv_systems (plant_id);
