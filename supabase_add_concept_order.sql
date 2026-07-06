-- Add order_index column to presupuesto_conceptos table
ALTER TABLE public.presupuesto_conceptos 
ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- Reset index based on created_at for existing concepts
-- using a CTE to rank concepts per budget
WITH ranked_concepts AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY presupuesto_id ORDER BY created_at ASC, id ASC) - 1 as new_order
  FROM public.presupuesto_conceptos
)
UPDATE public.presupuesto_conceptos pc
SET order_index = rc.new_order
FROM ranked_concepts rc
WHERE pc.id = rc.id;
