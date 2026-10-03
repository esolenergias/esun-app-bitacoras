export type EstadoCotizacionExpress = 'borrador' | 'emitido' | 'aprobada' | 'rechazada' | 'cobrada';

export interface PartidaCotizacionExpress {
  id: string;
  descripcion: string;
  unidad: string; // Servicio, Visita, PZA, ML, LOTE, etc.
  cantidad: number;
  precio_unitario: number;
  importe: number;
  notas?: string;
}

export interface CotizacionExpressData {
  id: string;
  folio: string; // COT-ESOL-2026-001 o BORR-001
  estado: EstadoCotizacionExpress;
  fecha: string;
  lugar: string;
  vigencia_dias: number;

  // Cliente
  cliente_id?: string;
  cliente_nombre: string;
  cliente_atencion?: string;
  cliente_rfc?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  cliente_email?: string;

  // Propuesta & Asunto
  asunto: string;
  vocativo: string;
  tipo_servicio: 'visita_tecnica' | 'servicios_profesionales' | 'suministro_insumos' | 'mantenimiento' | 'libre';
  descripcion_alcance: string; // Cuerpo explicativo del servicio

  // Conceptos y Costos
  partidas: PartidaCotizacionExpress[];
  subtotal: number;
  descuento: number;
  iva_porcentaje: number; // Generalmente 16 o 0
  iva_monto: number;
  total: number;
  total_letras?: string;

  // Condiciones Comerciales
  tiempo_entrega: string;
  condiciones_pago: string;
  banco_receptor?: string;
  cuenta_clabe?: string;
  notas_comerciales?: string;

  // Remitente y Firmas
  remitente_nombre: string;
  remitente_cargo: string;
  remitente_telefono?: string;
  remitente_email?: string;
  incluir_firma_digital: boolean;
  firma_digital?: string;

  // Google Drive & Export
  drive_url?: string;
  pdf_url?: string;
  fecha_emision?: string;
  fecha_aprobacion?: string;

  // Vinculación Financiera
  ingreso_id?: string; // ID en Tesorería / Egresos si se aprueba

  created_at?: string;
  updated_at?: string;
}

export interface PlantillaExpressPreset {
  id: string;
  titulo: string;
  subtitulo: string;
  asuntoDefault: string;
  tipo_servicio: CotizacionExpressData['tipo_servicio'];
  alcanceDefault: string;
  tiempoEntregaDefault: string;
  condicionesPagoDefault: string;
  partidasDefault: Omit<PartidaCotizacionExpress, 'id'>[];
}
