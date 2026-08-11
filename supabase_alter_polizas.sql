ALTER TABLE public.polizas_garantia 
ADD COLUMN IF NOT EXISTS estado_mantenimiento TEXT DEFAULT 'Sin programar',
ADD COLUMN IF NOT EXISTS fecha_proximo_mantenimiento DATE;
