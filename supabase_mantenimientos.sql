-- 1. Tabla para gestionar los Mantenimientos (equivalente a Obras)
CREATE TABLE public.mantenimientos_proyectos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    cliente TEXT,
    ubicacion TEXT,
    status TEXT DEFAULT 'Pendiente',
    residente TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para proyectos de mantenimiento
ALTER TABLE public.mantenimientos_proyectos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (Acceso total para los usuarios autenticados, igual que obras_app)
CREATE POLICY "mantenimientos_proyectos_select" ON public.mantenimientos_proyectos FOR SELECT USING (true);
CREATE POLICY "mantenimientos_proyectos_insert" ON public.mantenimientos_proyectos FOR INSERT WITH CHECK (true);
CREATE POLICY "mantenimientos_proyectos_update" ON public.mantenimientos_proyectos FOR UPDATE USING (true);
CREATE POLICY "mantenimientos_proyectos_delete" ON public.mantenimientos_proyectos FOR DELETE USING (true);

-- 2. Tabla para los Registros de Mantenimiento (equivalente a Bitácoras)
CREATE TABLE public.mantenimientos_registros (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    site_name TEXT NOT NULL,
    date TEXT NOT NULL,
    weather TEXT,
    crew_count NUMERIC,
    description TEXT,
    physical_progress NUMERIC,
    financial_progress NUMERIC,
    budget_estimate NUMERIC,
    latitude NUMERIC,
    longitude NUMERIC,
    photo_uri TEXT,
    concepto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_site_name
        FOREIGN KEY(site_name) 
        REFERENCES public.mantenimientos_proyectos(nombre)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Habilitar RLS para registros
ALTER TABLE public.mantenimientos_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mantenimientos_registros_select" ON public.mantenimientos_registros FOR SELECT USING (true);
CREATE POLICY "mantenimientos_registros_insert" ON public.mantenimientos_registros FOR INSERT WITH CHECK (true);
CREATE POLICY "mantenimientos_registros_update" ON public.mantenimientos_registros FOR UPDATE USING (true);
CREATE POLICY "mantenimientos_registros_delete" ON public.mantenimientos_registros FOR DELETE USING (true);
