// ==========================================================
// TIPOS DEL SISTEMA ADMINISTRATIVO (ERP ESOL ENERGÍAS)
// ==========================================================

export type AdminTabType =
  | 'resumen'
  | 'solicitudes_compra'
  | 'ordenes_compra'
  | 'recepciones'
  | 'inventario'
  | 'solicitudes_material'
  | 'vales_entrega'
  | 'devoluciones'
  | 'cierre'
  | 'finanzas_caja_bancos'
  | 'finanzas_ingresos'
  | 'finanzas_egresos'
  | 'catalogo_proveedores'
  | 'db_clientes'
  | 'db_proyectos'
  | 'db_materiales'
  | 'db_bitacoras'
  | 'db_oficios';

export type WorkflowStepId =
  | 'solicitud_compra'
  | 'autorizacion_compra'
  | 'orden_compra'
  | 'recepcion_revision'
  | 'inventario_kardex'
  | 'solicitud_material'
  | 'autorizacion_material'
  | 'vale_entrega'
  | 'devolucion_merma'
  | 'cierre_proyecto';

// ----------------------------------------------------------
// PROVEEDOR
// ----------------------------------------------------------
export interface Proveedor {
  id: string;
  nombre: string;
  razon_social?: string;
  nombre_comercial?: string;
  rfc?: string;
  contacto_nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  dias_credito: number;
  limite_credito: number;
  categoria_principal?: string;
  banco?: string;
  cuenta_bancaria?: string;
  clabe?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------
// 1 & 2. SOLICITUD DE COMPRA Y AUTORIZACIÓN
// ----------------------------------------------------------
export interface PartidaCompra {
  insumo_id?: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
  notas?: string;
}

export interface SolicitudCompra {
  id: string;
  folio: string; // SC-ESOL-2026-001
  fecha: string;
  proyecto_id?: string;
  proyecto_nombre?: string;
  solicitante_nombre: string;
  justificacion?: string;
  partidas: PartidaCompra[];
  total_estimado: number;
  estatus: 'pendiente' | 'aprobada' | 'rechazada' | 'ordenada';
  autorizado_por?: string;
  fecha_autorizacion?: string;
  orden_compra_id?: string;
  created_at?: string;
}

// ----------------------------------------------------------
// 3. ORDEN DE COMPRA (OC)
// ----------------------------------------------------------
export interface OrdenCompra {
  id: string;
  folio: string; // OC-ESOL-2026-001
  fecha: string;
  solicitud_compra_id?: string;
  folio_solicitud?: string;
  proveedor_id: string;
  proveedor_nombre: string;
  proyecto_id?: string;
  proyecto_nombre?: string;
  condicion_pago: 'contado' | 'credito';
  dias_credito: number;
  tiempo_entrega?: string;
  lugar_entrega?: string;
  partidas: PartidaCompra[];
  subtotal: number;
  iva: number;
  total: number;
  estatus: 'emitida' | 'aprobada' | 'recibida_parcial' | 'recibida_total' | 'cancelada';
  notas?: string;
  created_at?: string;
}

// ----------------------------------------------------------
// 4. RECEPCIÓN Y REVISIÓN
// ----------------------------------------------------------
export interface PartidaRecepcion {
  insumo_id?: string;
  descripcion: string;
  unidad: string;
  cantidad_ordenada: number;
  cantidad_recibida: number;
  precio_unitario?: number;
  estado_fisico: 'bueno' | 'danado' | 'incompleto';
  notas?: string;
}

export interface RecepcionMercancia {
  id: string;
  folio: string; // REC-ESOL-2026-001
  fecha_recepcion: string;
  orden_compra_id: string;
  folio_oc: string;
  proveedor_id?: string;
  proveedor_nombre: string;
  numero_factura?: string;
  numero_remision?: string;
  recibido_por: string;
  partidas: PartidaRecepcion[];
  estatus: 'completa' | 'parcial' | 'rechazada';
  conforme: boolean;
  observaciones?: string;
  created_at?: string;
}

// ----------------------------------------------------------
// 5. INVENTARIO Y KARDEX
// ----------------------------------------------------------
export interface ItemInventario {
  insumo_id: string;
  codigo?: string;
  nombre: string;
  categoria?: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  precio_promedio: number;
  marca?: string;
  ultimo_movimiento?: string;
}

export interface MovimientoKardex {
  id: string;
  fecha: string;
  insumo_id: string;
  insumo_nombre: string;
  tipo: 'entrada_compra' | 'salida_obra' | 'devolucion_sobrante' | 'merma' | 'ajuste_inventario';
  cantidad: number;
  costo_unitario: number;
  saldo_existencia: number;
  documento_tipo: 'orden_compra' | 'recepcion' | 'vale_entrega' | 'devolucion' | 'merma';
  folio_documento: string;
  referencia_id?: string;
  usuario_registro?: string;
}

// ----------------------------------------------------------
// 6 & 7. SOLICITUD Y AUTORIZACIÓN DE MATERIAL A OBRA
// ----------------------------------------------------------
export interface PartidaMaterialObra {
  insumo_id?: string;
  descripcion: string;
  unidad: string;
  cantidad_solicitada: number;
  cantidad_autorizada: number;
}

export interface SolicitudMaterial {
  id: string;
  folio: string; // SM-ESOL-2026-001
  fecha_solicitud: string;
  proyecto_id: string;
  proyecto_nombre: string;
  solicitante_nombre: string;
  justificacion?: string;
  partidas: PartidaMaterialObra[];
  estatus: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  autorizado_por?: string;
  fecha_autorizacion?: string;
  created_at?: string;
}

// ----------------------------------------------------------
// 8. VALE DE ENTREGA A OBRA
// ----------------------------------------------------------
export interface PartidaValeEntrega {
  insumo_id?: string;
  descripcion: string;
  unidad: string;
  cantidad_entregada: number;
  costo_unitario: number;
  importe_total: number;
}

export interface ValeEntrega {
  id: string;
  folio: string; // VE-ESOL-2026-001
  fecha_entrega: string;
  solicitud_material_id: string;
  folio_solicitud: string;
  proyecto_id: string;
  proyecto_nombre: string;
  entrega_nombre: string;
  recibe_nombre: string;
  partidas: PartidaValeEntrega[];
  total_costo: number;
  estatus: 'entregado' | 'cancelado';
  notas?: string;
  firma_digital_recibido?: string;
  created_at?: string;
}

// ----------------------------------------------------------
// 9. DEVOLUCIONES Y MERMAS
// ----------------------------------------------------------
export interface DevolucionMerma {
  id: string;
  folio: string; // DEV-ESOL-2026-001 o MER-ESOL-2026-001
  tipo: 'devolucion' | 'merma';
  fecha: string;
  proyecto_id?: string;
  proyecto_nombre?: string;
  insumo_id?: string;
  insumo_nombre: string;
  unidad: string;
  cantidad: number;
  costo_unitario?: number;
  motivo: string;
  responsable: string;
  created_at?: string;
}

// ----------------------------------------------------------
// 10. CIERRE DE PROYECTO
// ----------------------------------------------------------
export interface CierreProyectoData {
  id: string;
  folio: string; // CP-ESOL-2026-001
  fecha: string;
  proyecto_id: string;
  proyecto_nombre: string;
  cliente_nombre: string;
  venta_total: number;
  costo_presupuestado: number;
  costo_real_consumido: number;
  utilidad_real: number;
  margen_porcentaje: number;
  desviacion_costo: number;
  responsable_cierre: string;
  observaciones?: string;
  oficio_folio?: string;
}

// ----------------------------------------------------------
// FINANZAS: TESORERÍA, INGRESOS Y EGRESOS
// ----------------------------------------------------------
export interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo: 'caja_chica' | 'caja_grande' | 'banco';
  moneda: 'MXN' | 'USD';
  saldo_actual: number;
  banco?: string;
  numero_cuenta?: string;
  clabe?: string;
  responsable?: string;
  activa: boolean;
}

export interface MovimientoFinanciero {
  id: string;
  fecha: string;
  cuenta_id: string;
  tipo: 'ingreso' | 'egreso' | 'transferencia';
  categoria: string;
  monto: number;
  concepto: string;
  referencia?: string;
  usuario_registro?: string;
}

export interface IngresoRegistro {
  id: string;
  folio: string; // ING-ESOL-2026-001
  fecha: string;
  cliente_id?: string;
  cliente_nombre: string;
  proyecto_id?: string;
  proyecto_nombre?: string;
  concepto: string;
  monto_total: number;
  monto_cobrado: number;
  estatus: 'cobrado' | 'parcial' | 'pendiente';
  metodo_pago: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque';
  cuenta_destino_id?: string;
  referencia_factura?: string;
  usuario_registro?: string;
  created_at?: string;
}

export interface EgresoRegistro {
  id: string;
  folio: string; // EGR-ESOL-2026-001
  fecha: string;
  proveedor_id?: string;
  proveedor_nombre: string;
  orden_compra_id?: string;
  folio_oc?: string;
  concepto: string;
  monto_total: number;
  monto_pagado: number;
  estatus: 'pagado' | 'parcial' | 'pendiente';
  metodo_pago: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque';
  cuenta_origen_id?: string;
  referencia_factura?: string;
  usuario_registro?: string;
  created_at?: string;
}

// ----------------------------------------------------------
// KPIS EJECUTIVOS ($)
// ----------------------------------------------------------
export interface KpisFinancieros {
  inventario_disponible: number;
  valor_inventario: number;
  cuentas_por_cobrar: number;
  cuentas_por_pagar: number;
  ingresos_registrados: number;
  egresos_registrados: number;
  saldo_caja_chica: number;
  saldo_caja_grande: number;
  saldo_bancos: number;
  total_liquidez: number;
}

// ----------------------------------------------------------
// ENTIDADES REALES CONECTADAS DE LA BASE DE DATOS
// ----------------------------------------------------------
export interface ClienteReal {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  rfc?: string;
  direccion?: string;
}

export interface ProyectoReal {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente_nombre: string;
  total: number;
  costo_directo: number;
  indirect_percentage?: number;
  utility_percentage?: number;
  estatus?: string;
  folio?: string;
}

export interface InsumoReal {
  id: string;
  nombre: string;
  codigo?: string;
  categoria?: string;
  unidad: string;
  precio_unitario: number;
  tipo?: string;
}
