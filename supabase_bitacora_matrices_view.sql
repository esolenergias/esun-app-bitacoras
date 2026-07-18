-- ====================================================
-- ESOL ENERGÍAS — VISTA matrices_bitacora
-- Para la app de bitácora Android (AI Studio)
-- ====================================================
-- SEGURO: Solo crea una vista de lectura.
-- No modifica ninguna tabla existente.
-- No afecta al portal web.
-- ====================================================

CREATE OR REPLACE VIEW public.matrices_bitacora AS
SELECT
  -- Identificadores de la obra y concepto
  pc.presupuesto_id,
  pc.id                         AS concepto_id,
  m.code                        AS concept_code,
  pc.description                AS concept_description,

  -- Recurso (insumo) de la matriz
  i.description                 AS resource_description,

  -- Mapeo de tipo de insumo al formato que espera la app
  CASE i.type
    WHEN 'material'  THEN 'Material'
    WHEN 'labor'     THEN 'Mano de Obra'
    WHEN 'equipment' THEN 'Equipo'
    WHEN 'tool'      THEN 'Herramienta/Equipo'
    WHEN 'service'   THEN 'Servicio'
    ELSE i.type
  END                           AS resource_type,

  i.unit                        AS unit,
  mi.quantity                   AS quantity,
  i.cost                        AS unit_price,
  ROUND((mi.quantity * i.cost)::numeric, 2) AS total_cost,

  -- Datos extra útiles para la bitácora
  m.id                          AS matriz_id,
  i.id                          AS insumo_id,
  i.code                        AS insumo_code,
  m.indirect_percentage,
  m.utility_percentage

FROM public.presupuesto_conceptos pc
  INNER JOIN public.matrices       m  ON m.id       = pc.matriz_id
  INNER JOIN public.matriz_insumos mi ON mi.matriz_id = m.id
  INNER JOIN public.insumos        i  ON i.id        = mi.insumo_id;

-- Permiso de lectura para rol anon (app Android con anon key)
GRANT SELECT ON public.matrices_bitacora TO anon;

-- ====================================================
-- VERIFICACIÓN — Ejecuta esto para confirmar
-- ====================================================
-- SELECT presupuesto_id, concept_code, resource_description,
--        resource_type, unit, quantity, unit_price, total_cost
-- FROM public.matrices_bitacora
-- LIMIT 20;
