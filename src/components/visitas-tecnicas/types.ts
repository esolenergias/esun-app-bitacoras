export type TipoVisita = 
  | 'Levantamiento Fotovoltaico'
  | 'Inspección Técnica Preliminar'
  | 'Supervisión de Avance'
  | 'Entrega y Recepción de Obra'
  | 'Diagnóstico y Detección de Fallas'
  | 'Factibilidad de Interconexión CFE'
  | 'Mantenimiento Preventivo / Correctivo'
  | 'Otro';

export type EstadoVisita = 'borrador' | 'completada' | 'en_revision' | 'requiere_presupuesto';

export interface FotoEvidencia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  descripcion: string;
  fecha?: string;
}

export interface PuntoClave {
  id: string;
  titulo: string;
  descripcion?: string;
  categoria?: 'electrico' | 'estructural' | 'espacio' | 'seguridad' | 'cfe' | 'general';
}

export interface ParametrosTecnicos {
  tipo_red?: 'Monofásica (1F)' | 'Bifásica (2F)' | 'Trifásica (3F)' | 'Media Tensión' | '';
  voltaje_medido?: string; // ej. 127V / 220V
  capacidad_interruptor?: string; // ej. 100A
  tipo_techumbre?: 'Lámina Engargolada' | 'Lámina KR-18' | 'Losa de Concreto' | 'Teja' | 'Estructura Elevada' | 'Suelo / Terreno' | 'Otro' | '';
  inclinacion_grados?: number | string;
  orientacion?: string; // ej. Sur 180°
  area_disponible_m2?: number | string;
  condicion_techumbre?: 'Excelente' | 'Buena' | 'Regular' | 'Requiere Refuerzo' | '';
  nivel_sombras?: 'Nulo (Sin sombras)' | 'Bajo (<10%)' | 'Medio (Sombras matutinas/vespertinas)' | 'Crítico' | '';
  tarifa_cfe?: '01' | '1A' | '1B' | '1C' | '1D' | '1E' | '1F' | 'DAC' | 'PDBT' | 'GDBT' | 'GDMTO' | 'GDMTH' | 'No especificada' | '';
}

export interface VisitaTecnica {
  id: string;
  folio: string;
  fecha_visita: string; // ISO date-time or YYYY-MM-DD
  fecha_expedicion: string; // YYYY-MM-DD
  tipo_visita: TipoVisita;
  estado: EstadoVisita;

  // Asociación a Obra existente o Cliente Independiente
  es_obra_existente: boolean;
  obra_nombre?: string;
  presupuesto_id?: string | null;
  cliente_id?: string | null;
  cliente_nombre: string;
  sitio_nombre: string;
  ubicacion: string;
  coordenadas_gps?: {
    latitud?: number;
    longitud?: number;
  } | null;

  // Datos de Personal
  elaboro_nombre: string;
  elaboro_cargo: string;
  elaboro_telefono?: string;
  recibe_nombre: string;
  recibe_cargo: string;
  recibe_telefono?: string;

  // Contenido Técnico
  descripcion: string;
  puntos_clave: PuntoClave[];
  parametros_tecnicos?: ParametrosTecnicos;
  recomendaciones?: string;
  siguientes_pasos?: string;

  // Evidencias y Firmas
  fotografias: FotoEvidencia[];
  firma_elaboro?: string | null; // DataURL o SVG
  firma_recibe?: string | null;  // DataURL o SVG

  created_at?: string;
  updated_at?: string;
}

export interface FiltrosVisitas {
  busqueda: string;
  tipo: string;
  estado: string;
  obra: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
