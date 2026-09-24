ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS registered_by TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;
