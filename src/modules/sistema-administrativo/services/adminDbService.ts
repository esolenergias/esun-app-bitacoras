import { supabase } from '../../../context/supabase';
import type {
  Proveedor,
  SolicitudCompra,
  OrdenCompra,
  RecepcionMercancia,
  ItemInventario,
  MovimientoKardex,
  SolicitudMaterial,
  ValeEntrega,
  DevolucionMerma,
  CuentaFinanciera,
  MovimientoFinanciero,
  IngresoRegistro,
  EgresoRegistro,
  ClienteReal,
  ProyectoReal,
  InsumoReal,
  KpisFinancieros
} from '../types/adminTypes';
import type { OficioData } from '../../../components/legal/oficios/types';
import { getNextFolio } from '../../../components/legal/oficios/OficiosTab';

// Storage Keys
const KEYS = {
  PROVEEDORES: 'esol_admin_proveedores',
  SOLICITUDES_COMPRA: 'esol_admin_solicitudes_compra',
  ORDENES_COMPRA: 'esol_admin_ordenes_compra',
  RECEPCIONES: 'esol_admin_recepciones',
  INVENTARIO: 'esol_admin_inventario',
  KARDEX: 'esol_admin_kardex',
  SOLICITUDES_MATERIAL: 'esol_admin_solicitudes_material',
  VALES_ENTREGA: 'esol_admin_vales_entrega',
  DEVOLUCIONES: 'esol_admin_devoluciones_mermas',
  CUENTAS: 'esol_admin_cuentas_financieras',
  MOVIMIENTOS: 'esol_admin_movimientos_financieros',
  INGRESOS: 'esol_admin_ingresos',
  EGRESOS: 'esol_admin_egresos'
};

// Cuentas de Tesorería oficiales con saldo inicial en 0 (Alimentadas por movimientos reales)
export const DEFAULT_CUENTAS: CuentaFinanciera[] = [
  {
    id: 'caja-chica-01',
    nombre: 'Caja Chica Obra / Operativa',
    tipo: 'caja_chica',
    moneda: 'MXN',
    saldo_actual: 0,
    responsable: 'Administración de Obra',
    activa: true
  },
  {
    id: 'caja-grande-01',
    nombre: 'Caja Grande General Esol',
    tipo: 'caja_grande',
    moneda: 'MXN',
    saldo_actual: 0,
    responsable: 'Dirección General (Master)',
    activa: true
  },
  {
    id: 'banco-bbva-01',
    nombre: 'BBVA Bancomer Esol Energías',
    tipo: 'banco',
    moneda: 'MXN',
    saldo_actual: 0,
    responsable: 'Tesorería Esol',
    banco: 'BBVA México',
    numero_cuenta: '',
    clabe: '',
    activa: true
  }
];

// Helper: Generic Local Storage getter
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

// Helper: Generic Local Storage setter
function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`LocalStorage quota exceeded for ${key}:`, e);
  }
}

// Generador de folios
export function generateAdminFolio(prefix: string, existingList: { folio?: string }[] = []): string {
  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-ESOL-${currentYear}-(\\d+)$`, 'i');
  let maxNum = 0;

  if (Array.isArray(existingList)) {
    existingList.forEach(item => {
      if (item.folio) {
        const match = item.folio.match(pattern);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  return `${prefix}-ESOL-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

export class AdminDbService {
  constructor() {
    this.purgarDatosInventadosLegacy();
  }

  // Purga definitiva de datos de ejemplo o seed antiguos del navegador
  private purgarDatosInventadosLegacy() {
    try {
      const recepciones = getLocal<any[]>(KEYS.RECEPCIONES, []);
      // Si no hay recepciones de mercancía reales registradas, resetear inventario y kardex a existencia 0
      if (recepciones.length === 0) {
        localStorage.removeItem(KEYS.INVENTARIO);
        localStorage.removeItem(KEYS.KARDEX);
      }

      // Purgar proveedores fake si existen
      const provs = getLocal<Proveedor[]>(KEYS.PROVEEDORES, []);
      if (provs.some(p => p.id.startsWith('prov-00') || p.nombre.includes('Distribuidora Solar'))) {
        localStorage.removeItem(KEYS.PROVEEDORES);
      }

      // Reajustar saldos inflados en cuentas de prueba a 0 si no tienen movimientos reales
      const movs = getLocal<MovimientoFinanciero[]>(KEYS.MOVIMIENTOS, []);
      if (movs.length === 0) {
        localStorage.removeItem(KEYS.CUENTAS);
      }
    } catch (e) {
      console.warn('Error purgando datos legacy:', e);
    }
  }

  // 1. CARGA COMPLETA DE DATOS (CONECTADO EXCLUSIVAMENTE A BASES REALES)
  async cargarDatosCompletos() {
    const [
      clientesRes,
      presupuestosRes,
      insumosRes
    ] = await Promise.all([
      this.fetchClientesReales(),
      this.fetchProyectosReales(),
      this.fetchInsumosReales()
    ]);

    const proveedores = this.getProveedores();
    const solicitudesCompra = this.getSolicitudesCompra();
    const ordenesCompra = this.getOrdenesCompra();
    const recepciones = this.getRecepciones();
    const inventario = this.getInventario(insumosRes);
    const kardex = this.getKardex();
    const solicitudesMaterial = this.getSolicitudesMaterial();
    const valesEntrega = this.getValesEntrega();
    const devoluciones = this.getDevoluciones();
    const cuentas = this.getCuentas();
    const movimientos = this.getMovimientos();
    const ingresos = this.getIngresos();
    const egresos = this.getEgresos();

    // Calcular KPIs reales (Cero si no hay existencias ni movimientos)
    const valorInventario = inventario.reduce((acc, it) => acc + (it.stock_actual * it.precio_promedio), 0);
    const inventarioDisponible = inventario.reduce((acc, it) => acc + it.stock_actual, 0);
    const cuentasPorCobrar = ingresos.reduce((acc, ing) => acc + (ing.monto_total - ing.monto_cobrado), 0);
    const cuentasPorPagar = egresos.reduce((acc, egr) => acc + (egr.monto_total - egr.monto_pagado), 0);
    const ingresosRegistrados = ingresos.reduce((acc, ing) => acc + ing.monto_cobrado, 0);
    const egresosRegistrados = egresos.reduce((acc, egr) => acc + egr.monto_pagado, 0);

    const saldoCajaChica = cuentas.find(c => c.tipo === 'caja_chica')?.saldo_actual || 0;
    const saldoCajaGrande = cuentas.find(c => c.tipo === 'caja_grande')?.saldo_actual || 0;
    const saldoBancos = cuentas.filter(c => c.tipo === 'banco').reduce((acc, c) => acc + c.saldo_actual, 0);
    const totalLiquidez = saldoCajaChica + saldoCajaGrande + saldoBancos;

    const kpis: KpisFinancieros = {
      inventario_disponible: inventarioDisponible,
      valor_inventario: valorInventario,
      cuentas_por_cobrar: cuentasPorCobrar,
      cuentas_por_pagar: cuentasPorPagar,
      ingresos_registrados: ingresosRegistrados,
      egresos_registrados: egresosRegistrados,
      saldo_caja_chica: saldoCajaChica,
      saldo_caja_grande: saldoCajaGrande,
      saldo_bancos: saldoBancos,
      total_liquidez: totalLiquidez
    };

    return {
      kpis,
      clientes: clientesRes,
      proyectos: presupuestosRes,
      insumos: insumosRes,
      proveedores,
      solicitudesCompra,
      ordenesCompra,
      recepciones,
      inventario,
      kardex,
      solicitudesMaterial,
      valesEntrega,
      devoluciones,
      cuentas,
      movimientos,
      ingresos,
      egresos
    };
  }

  // Clientes reales desde base de datos Supabase (tabla `clientes` con campo `nombre_razon_social`)
  async fetchClientesReales(): Promise<ClienteReal[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        return data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre_razon_social || c.nombre || 'Cliente sin nombre',
          email: c.email || '',
          telefono: c.telefono || '',
          rfc: c.rfc || '',
          direccion: c.direccion || ''
        }));
      }
    } catch (e) {
      console.warn('Error fetching clientes:', e);
    }
    return [];
  }

  // Guardar / Actualizar Cliente Real en Supabase (Bilateral)
  async guardarClienteReal(cliente: Partial<ClienteReal>): Promise<ClienteReal> {
    const payload: any = {
      nombre_razon_social: cliente.nombre?.trim(),
      nombre: cliente.nombre?.trim(),
      rfc: cliente.rfc?.trim().toUpperCase() || '',
      telefono: cliente.telefono?.trim() || '',
      email: cliente.email?.trim() || '',
      direccion: cliente.direccion?.trim() || ''
    };
    if (cliente.id && !cliente.id.startsWith('temp-')) {
      payload.id = cliente.id;
    }
    const { data, error } = await supabase
      .from('clientes')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error guardando cliente en Supabase:', error);
      throw error;
    }
    return {
      id: data.id,
      nombre: data.nombre_razon_social || data.nombre || 'Cliente',
      email: data.email || '',
      telefono: data.telefono || '',
      rfc: data.rfc || '',
      direccion: data.direccion || ''
    };
  }

  // Eliminar Cliente Real en Supabase (Bilateral)
  async eliminarClienteReal(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error eliminando cliente en Supabase:', error);
      throw error;
    }
  }

  // Proyectos y Presupuestos reales desde base de datos Supabase (tabla `presupuestos`)
  async fetchProyectosReales(): Promise<ProyectoReal[]> {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .select(`
          id,
          name,
          client_name,
          status,
          indirect_percentage,
          utility_percentage,
          presupuesto_conceptos (
            quantity,
            cost_price
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        return data.map((p: any) => {
          let cd = 0;
          if (p.presupuesto_conceptos && Array.isArray(p.presupuesto_conceptos)) {
            p.presupuesto_conceptos.forEach((c: any) => {
              cd += (Number(c.quantity) || 0) * (Number(c.cost_price) || 0);
            });
          }
          const indPct = Number(p.indirect_percentage ?? 10.00);
          const utPct = Number(p.utility_percentage ?? 8.00);
          const indCost = cd * (indPct / 100);
          const util = (cd + indCost) * (utPct / 100);
          const totalConIva = (cd + indCost + util) * 1.16;

          return {
            id: p.id,
            titulo: p.name || 'Proyecto Solar',
            folio: p.name || `PRY-${p.id.slice(0, 6)}`,
            cliente_id: '',
            cliente_nombre: p.client_name || 'Cliente General',
            total: totalConIva || 0,
            costo_directo: cd || 0,
            indirect_percentage: indPct,
            utility_percentage: utPct,
            estatus: p.status || 'borrador'
          };
        });
      }
    } catch (e) {
      console.warn('Error fetching presupuestos:', e);
    }
    return [];
  }

  // Guardar / Actualizar Proyecto Real en Supabase (Bilateral)
  async guardarProyectoReal(proy: Partial<ProyectoReal>): Promise<void> {
    const payload: any = {
      name: proy.titulo?.trim(),
      client_name: proy.cliente_nombre?.trim(),
      status: proy.estatus || 'borrador',
      indirect_percentage: proy.indirect_percentage ?? 10.00,
      utility_percentage: proy.utility_percentage ?? 8.00
    };
    if (proy.id && !proy.id.startsWith('temp-')) {
      payload.id = proy.id;
    }
    const { error } = await supabase
      .from('presupuestos')
      .upsert(payload);

    if (error) {
      console.error('Error guardando proyecto en Supabase:', error);
      throw error;
    }
  }

  // Eliminar Proyecto Real en Supabase (Bilateral)
  async eliminarProyectoReal(id: string): Promise<void> {
    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error eliminando presupuesto en Supabase:', error);
      throw error;
    }
  }

  // Insumos maestros reales desde base de datos Supabase (tabla `insumos` con `code`, `description`, `cost`)
  async fetchInsumosReales(): Promise<InsumoReal[]> {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('code', { ascending: true });

      if (!error && data && Array.isArray(data)) {
        return data.map((i: any) => ({
          id: i.id,
          nombre: i.description || i.name || 'Insumo',
          codigo: i.code || '',
          categoria: i.subcategory || i.type || 'General',
          unidad: i.unit || 'PZA',
          precio_unitario: Number(i.cost ?? i.price_unit ?? 0),
          tipo: i.type || 'material'
        }));
      }
    } catch (e) {
      console.warn('Error fetching insumos:', e);
    }
    return [];
  }

  // Guardar / Actualizar Insumo Maestro en Supabase (Bilateral)
  async guardarInsumoReal(insumo: Partial<InsumoReal>): Promise<InsumoReal> {
    const payload: any = {
      code: insumo.codigo?.trim().toUpperCase(),
      description: insumo.nombre?.trim(),
      subcategory: insumo.categoria?.trim() || 'General',
      unit: insumo.unidad?.trim() || 'PZA',
      cost: Number(insumo.precio_unitario) || 0,
      type: insumo.tipo || 'material'
    };
    if (insumo.id && !insumo.id.startsWith('temp-')) {
      payload.id = insumo.id;
    }
    const { data, error } = await supabase
      .from('insumos')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error guardando insumo en Supabase:', error);
      throw error;
    }

    return {
      id: data.id,
      nombre: data.description || data.name || '',
      codigo: data.code || '',
      categoria: data.subcategory || data.type || 'General',
      unidad: data.unit || 'PZA',
      precio_unitario: Number(data.cost ?? 0),
      tipo: data.type || 'material'
    };
  }

  // Eliminar Insumo Maestro en Supabase (Bilateral)
  async eliminarInsumoReal(id: string): Promise<void> {
    const { error } = await supabase
      .from('insumos')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error eliminando insumo en Supabase:', error);
      throw error;
    }
  }

  // ----------------------------------------------------------
  // PROVEEDORES (Almacenados y gestionados por el usuario)
  // ----------------------------------------------------------
  getProveedores(): Proveedor[] {
    return getLocal<Proveedor[]>(KEYS.PROVEEDORES, []);
  }

  async guardarProveedor(prov: Partial<Proveedor>): Promise<Proveedor> {
    const list = this.getProveedores();
    const updated: Proveedor = {
      id: prov.id || `prov-${Date.now()}`,
      nombre: prov.nombre || 'Nuevo Proveedor',
      rfc: prov.rfc || '',
      contacto_nombre: prov.contacto_nombre || '',
      telefono: prov.telefono || '',
      email: prov.email || '',
      direccion: prov.direccion || '',
      dias_credito: prov.dias_credito || 30,
      limite_credito: prov.limite_credito || 50000,
      categoria_principal: prov.categoria_principal || 'General',
      created_at: prov.created_at || new Date().toISOString()
    };

    const idx = list.findIndex(p => p.id === updated.id);
    if (idx >= 0) list[idx] = updated; else list.push(updated);
    setLocal(KEYS.PROVEEDORES, list);
    return updated;
  }

  async eliminarProveedor(id: string): Promise<void> {
    const list = this.getProveedores().filter(p => p.id !== id);
    setLocal(KEYS.PROVEEDORES, list);
  }

  // ----------------------------------------------------------
  // SOLICITUDES DE COMPRA (Paso 1 y 2)
  // ----------------------------------------------------------
  getSolicitudesCompra(): SolicitudCompra[] {
    return getLocal<SolicitudCompra[]>(KEYS.SOLICITUDES_COMPRA, []);
  }

  async crearSolicitudCompra(data: Partial<SolicitudCompra>): Promise<SolicitudCompra> {
    const list = this.getSolicitudesCompra();
    const folio = data.folio || generateAdminFolio('SC', list);
    const total = (data.partidas || []).reduce((acc, it) => acc + (it.importe || (it.cantidad * it.precio_unitario)), 0);

    const nueva: SolicitudCompra = {
      id: data.id || `sc-${Date.now()}`,
      folio,
      fecha: data.fecha || new Date().toISOString(),
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre,
      proyecto_id: data.proyecto_id,
      proyecto_nombre: data.proyecto_nombre || 'General',
      solicitante_nombre: data.solicitante_nombre || 'Residente',
      justificacion: data.justificacion || '',
      partidas: data.partidas || [],
      total_estimado: total,
      estatus: data.estatus || 'pendiente',
      autorizado_por: data.autorizado_por,
      fecha_autorizacion: data.fecha_autorizacion,
      orden_compra_id: data.orden_compra_id,
      folio_oficio: data.folio_oficio,
      pdf_url: data.pdf_url,
      created_at: data.created_at || new Date().toISOString()
    };

    const existingIdx = list.findIndex(s => s.id === nueva.id || s.folio === nueva.folio);
    if (existingIdx >= 0) {
      list[existingIdx] = nueva;
    } else {
      list.unshift(nueva);
    }
    setLocal(KEYS.SOLICITUDES_COMPRA, list);
    return nueva;
  }

  async autorizarSolicitudCompra(id: string, accion: 'aprobada' | 'rechazada', autorizador: string): Promise<void> {
    const list = this.getSolicitudesCompra();
    const sc = list.find(s => s.id === id);
    if (sc) {
      sc.estatus = accion;
      sc.autorizado_por = autorizador;
      sc.fecha_autorizacion = new Date().toISOString();
      setLocal(KEYS.SOLICITUDES_COMPRA, list);
    }
  }

  // ----------------------------------------------------------
  // ÓRDENES DE COMPRA (Paso 3)
  // ----------------------------------------------------------
  getOrdenesCompra(): OrdenCompra[] {
    return getLocal<OrdenCompra[]>(KEYS.ORDENES_COMPRA, []);
  }

  async crearOrdenCompra(data: Partial<OrdenCompra>): Promise<OrdenCompra> {
    const list = this.getOrdenesCompra();
    const folio = data.folio || generateAdminFolio('OC', list);
    const subtotal = (data.partidas || []).reduce((acc, it) => acc + (it.importe || (it.cantidad * it.precio_unitario)), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const nueva: OrdenCompra = {
      id: data.id || `oc-${Date.now()}`,
      folio,
      fecha: data.fecha || new Date().toISOString(),
      solicitud_compra_id: data.solicitud_compra_id,
      folio_solicitud: data.folio_solicitud,
      proveedor_id: data.proveedor_id || '',
      proveedor_nombre: data.proveedor_nombre || 'Proveedor',
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre,
      proyecto_id: data.proyecto_id,
      proyecto_nombre: data.proyecto_nombre,
      condicion_pago: data.condicion_pago || 'credito',
      dias_credito: data.dias_credito || 30,
      tiempo_entrega: data.tiempo_entrega || '3 a 5 días hábiles',
      lugar_entrega: data.lugar_entrega || 'Almacén Central Hermosillo',
      partidas: data.partidas || [],
      subtotal,
      iva,
      total,
      estatus: data.estatus || 'aprobada',
      notas: data.notas || '',
      folio_oficio: data.folio_oficio,
      pdf_url: data.pdf_url,
      created_at: data.created_at || new Date().toISOString()
    };

    const existingIdx = list.findIndex(o => o.id === nueva.id || o.folio === nueva.folio);
    if (existingIdx >= 0) {
      list[existingIdx] = nueva;
    } else {
      list.unshift(nueva);
    }
    setLocal(KEYS.ORDENES_COMPRA, list);

    // Si viene de una solicitud, marcarla como ordenada
    if (data.solicitud_compra_id) {
      const scList = this.getSolicitudesCompra();
      const sc = scList.find(s => s.id === data.solicitud_compra_id);
      if (sc) {
        sc.estatus = 'ordenada';
        sc.orden_compra_id = nueva.id;
        setLocal(KEYS.SOLICITUDES_COMPRA, scList);
      }
    }

    return nueva;
  }

  // ----------------------------------------------------------
  // RECEPCIONES Y REVISIÓN (Paso 4 -> Almacén & Kardex)
  // ----------------------------------------------------------
  getRecepciones(): RecepcionMercancia[] {
    return getLocal<RecepcionMercancia[]>(KEYS.RECEPCIONES, []);
  }

  async crearRecepcion(data: Partial<RecepcionMercancia>, insumos: InsumoReal[] = []): Promise<RecepcionMercancia> {
    const list = this.getRecepciones();
    const folio = data.folio || generateAdminFolio('REC', list);

    const nueva: RecepcionMercancia = {
      id: data.id || `rec-${Date.now()}`,
      folio,
      fecha_recepcion: data.fecha_recepcion || new Date().toISOString(),
      orden_compra_id: data.orden_compra_id || '',
      folio_oc: data.folio_oc || '',
      proveedor_id: data.proveedor_id,
      proveedor_nombre: data.proveedor_nombre || 'Proveedor',
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre,
      proyecto_id: data.proyecto_id,
      proyecto_nombre: data.proyecto_nombre,
      numero_factura: data.numero_factura,
      numero_remision: data.numero_remision,
      recibido_por: data.recibido_por || 'Encargado de Almacén',
      partidas: data.partidas || [],
      estatus: data.estatus || 'completa',
      conforme: data.conforme !== undefined ? data.conforme : true,
      observaciones: data.observaciones,
      folio_oficio: data.folio_oficio,
      pdf_url: data.pdf_url,
      created_at: data.created_at || new Date().toISOString()
    };

    const existingIdx = list.findIndex(r => r.id === nueva.id || r.folio === nueva.folio);
    if (existingIdx >= 0) {
      list[existingIdx] = nueva;
    } else {
      list.unshift(nueva);
    }
    setLocal(KEYS.RECEPCIONES, list);

    // Ingresar al Kardex e Inventario cada partida recibida
    const inventario = this.getInventario(insumos);
    const kardex = this.getKardex();

    for (const p of nueva.partidas) {
      if (p.cantidad_recibida > 0 && p.estado_fisico === 'bueno') {
        let invItem = inventario.find(i => (p.insumo_id && i.insumo_id === p.insumo_id) || i.nombre === p.descripcion);
        if (!invItem) {
          invItem = {
            insumo_id: p.insumo_id || `ins-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            nombre: p.descripcion,
            unidad: p.unidad || 'PZA',
            stock_actual: 0,
            stock_minimo: 0,
            precio_promedio: p.precio_unitario || 0
          };
          inventario.push(invItem);
        }

        invItem.stock_actual += p.cantidad_recibida;
        if (p.precio_unitario && p.precio_unitario > 0) {
          invItem.precio_promedio = p.precio_unitario;
        }

        // Registrar en Kardex
        kardex.unshift({
          id: `krd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          fecha: new Date().toISOString(),
          insumo_id: invItem.insumo_id,
          insumo_nombre: invItem.nombre,
          tipo: 'entrada_compra',
          cantidad: p.cantidad_recibida,
          costo_unitario: p.precio_unitario || invItem.precio_promedio,
          saldo_existencia: invItem.stock_actual,
          documento_tipo: 'recepcion',
          folio_documento: folio,
          usuario_registro: nueva.recibido_por
        });
      }
    }

    setLocal(KEYS.INVENTARIO, inventario);
    setLocal(KEYS.KARDEX, kardex);

    return nueva;
  }

  // ----------------------------------------------------------
  // INVENTARIO Y KARDEX (Paso 5)
  // ----------------------------------------------------------
  getInventario(catalogoInsumos: InsumoReal[] = []): ItemInventario[] {
    const list = getLocal<ItemInventario[]>(KEYS.INVENTARIO, []);
    if (list.length > 0) return list;

    // Basado directamente en el catálogo maestro de insumos reales con stock inicial estrictamente en 0
    const inicial: ItemInventario[] = catalogoInsumos.map(ins => ({
      insumo_id: ins.id,
      codigo: ins.codigo,
      nombre: ins.nombre,
      categoria: ins.categoria,
      unidad: ins.unidad,
      stock_actual: 0,
      stock_minimo: 0,
      precio_promedio: ins.precio_unitario,
      marca: ''
    }));

    if (inicial.length > 0) {
      setLocal(KEYS.INVENTARIO, inicial);
    }
    return inicial;
  }

  getKardex(): MovimientoKardex[] {
    return getLocal<MovimientoKardex[]>(KEYS.KARDEX, []);
  }

  // ----------------------------------------------------------
  // SOLICITUDES DE MATERIAL A OBRA (Paso 6 y 7)
  // ----------------------------------------------------------
  getSolicitudesMaterial(): SolicitudMaterial[] {
    return getLocal<SolicitudMaterial[]>(KEYS.SOLICITUDES_MATERIAL, []);
  }

  async crearSolicitudMaterial(data: Partial<SolicitudMaterial>): Promise<SolicitudMaterial> {
    const list = this.getSolicitudesMaterial();
    const folio = data.folio || generateAdminFolio('SM', list);

    const nueva: SolicitudMaterial = {
      id: data.id || `sm-${Date.now()}`,
      folio,
      fecha_solicitud: data.fecha_solicitud || new Date().toISOString(),
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre,
      proyecto_id: data.proyecto_id || '',
      proyecto_nombre: data.proyecto_nombre || 'Proyecto Obra',
      solicitante_nombre: data.solicitante_nombre || 'Residente de Obra',
      justificacion: data.justificacion,
      partidas: data.partidas || [],
      estatus: data.estatus || 'pendiente',
      folio_oficio: data.folio_oficio,
      pdf_url: data.pdf_url,
      created_at: data.created_at || new Date().toISOString()
    };

    const existingIdx = list.findIndex(s => s.id === nueva.id || s.folio === nueva.folio);
    if (existingIdx >= 0) {
      list[existingIdx] = nueva;
    } else {
      list.unshift(nueva);
    }
    setLocal(KEYS.SOLICITUDES_MATERIAL, list);
    return nueva;
  }

  async autorizarSolicitudMaterial(id: string, accion: 'aprobada' | 'rechazada', autorizador: string): Promise<void> {
    const list = this.getSolicitudesMaterial();
    const sm = list.find(s => s.id === id);
    if (sm) {
      sm.estatus = accion;
      sm.autorizado_por = autorizador;
      sm.fecha_autorizacion = new Date().toISOString();
      setLocal(KEYS.SOLICITUDES_MATERIAL, list);
    }
  }

  // ----------------------------------------------------------
  // VALES DE ENTREGA (Paso 8 -> Salida de Almacén)
  // ----------------------------------------------------------
  getValesEntrega(): ValeEntrega[] {
    return getLocal<ValeEntrega[]>(KEYS.VALES_ENTREGA, []);
  }

  async crearValeEntrega(data: Partial<ValeEntrega>): Promise<ValeEntrega> {
    const list = this.getValesEntrega();
    const folio = data.folio || generateAdminFolio('VE', list);

    const totalCosto = (data.partidas || []).reduce((acc, it) => acc + (it.importe_total || (it.cantidad_entregada * it.costo_unitario)), 0);

    const nuevo: ValeEntrega = {
      id: data.id || `ve-${Date.now()}`,
      folio,
      fecha_entrega: data.fecha_entrega || new Date().toISOString(),
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre,
      solicitud_material_id: data.solicitud_material_id || '',
      folio_solicitud: data.folio_solicitud || '',
      proyecto_id: data.proyecto_id || '',
      proyecto_nombre: data.proyecto_nombre || 'Obra',
      entrega_nombre: data.entrega_nombre || 'Almacenista',
      recibe_nombre: data.recibe_nombre || 'Residente',
      partidas: data.partidas || [],
      total_costo: totalCosto,
      estatus: data.estatus || 'entregado',
      notas: data.notas,
      firma_digital_recibido: data.firma_digital_recibido,
      folio_oficio: data.folio_oficio,
      pdf_url: data.pdf_url,
      created_at: data.created_at || new Date().toISOString()
    };

    const existingIdx = list.findIndex(v => v.id === nuevo.id || v.folio === nuevo.folio);
    if (existingIdx >= 0) {
      list[existingIdx] = nuevo;
    } else {
      list.unshift(nuevo);
    }
    setLocal(KEYS.VALES_ENTREGA, list);

    // Descontar existencias del inventario y registrar salida en Kardex
    const inventario = this.getInventario();
    const kardex = this.getKardex();

    for (const p of nuevo.partidas) {
      const invItem = inventario.find(i => (p.insumo_id && i.insumo_id === p.insumo_id) || i.nombre === p.descripcion);
      if (invItem) {
        invItem.stock_actual = Math.max(0, invItem.stock_actual - p.cantidad_entregada);

        kardex.unshift({
          id: `krd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          fecha: new Date().toISOString(),
          insumo_id: invItem.insumo_id,
          insumo_nombre: invItem.nombre,
          tipo: 'salida_obra',
          cantidad: p.cantidad_entregada,
          costo_unitario: p.costo_unitario || invItem.precio_promedio,
          saldo_existencia: invItem.stock_actual,
          documento_tipo: 'vale_entrega',
          folio_documento: folio,
          usuario_registro: nuevo.entrega_nombre
        });
      }
    }

    setLocal(KEYS.INVENTARIO, inventario);
    setLocal(KEYS.KARDEX, kardex);

    // Marcar solicitud como entregada
    if (data.solicitud_material_id) {
      const smList = this.getSolicitudesMaterial();
      const sm = smList.find(s => s.id === data.solicitud_material_id);
      if (sm) {
        sm.estatus = 'entregada';
        setLocal(KEYS.SOLICITUDES_MATERIAL, smList);
      }
    }

    return nuevo;
  }

  // ----------------------------------------------------------
  // DEVOLUCIONES Y MERMAS (Paso 9)
  // ----------------------------------------------------------
  getDevoluciones(): DevolucionMerma[] {
    return getLocal<DevolucionMerma[]>(KEYS.DEVOLUCIONES, []);
  }

  async crearDevolucionMerma(data: Partial<DevolucionMerma>): Promise<DevolucionMerma> {
    const list = this.getDevoluciones();
    const prefix = data.tipo === 'devolucion' ? 'DEV' : 'MER';
    const folio = generateAdminFolio(prefix, list);

    const nuevo: DevolucionMerma = {
      id: `dev-${Date.now()}`,
      folio,
      tipo: data.tipo || 'devolucion',
      fecha: new Date().toISOString(),
      proyecto_id: data.proyecto_id,
      proyecto_nombre: data.proyecto_nombre,
      insumo_id: data.insumo_id,
      insumo_nombre: data.insumo_nombre || 'Material',
      unidad: data.unidad || 'PZA',
      cantidad: data.cantidad || 1,
      costo_unitario: data.costo_unitario,
      motivo: data.motivo || '',
      responsable: data.responsable || 'Almacenista',
      created_at: new Date().toISOString()
    };

    list.unshift(nuevo);
    setLocal(KEYS.DEVOLUCIONES, list);

    // Si es devolución, reingresar a inventario
    if (nuevo.tipo === 'devolucion') {
      const inventario = this.getInventario();
      const kardex = this.getKardex();
      const invItem = inventario.find(i => (nuevo.insumo_id && i.insumo_id === nuevo.insumo_id) || i.nombre === nuevo.insumo_nombre);

      if (invItem) {
        invItem.stock_actual += nuevo.cantidad;

        kardex.unshift({
          id: `krd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          fecha: new Date().toISOString(),
          insumo_id: invItem.insumo_id,
          insumo_nombre: invItem.nombre,
          tipo: 'devolucion_sobrante',
          cantidad: nuevo.cantidad,
          costo_unitario: nuevo.costo_unitario || invItem.precio_promedio,
          saldo_existencia: invItem.stock_actual,
          documento_tipo: 'devolucion',
          folio_documento: folio,
          usuario_registro: nuevo.responsable
        });

        setLocal(KEYS.INVENTARIO, inventario);
        setLocal(KEYS.KARDEX, kardex);
      }
    }

    return nuevo;
  }

  // ----------------------------------------------------------
  // FINANZAS: TESORERÍA, INGRESOS Y EGRESOS
  // ----------------------------------------------------------
  getCuentas(): CuentaFinanciera[] {
    const list = getLocal<CuentaFinanciera[]>(KEYS.CUENTAS, []);
    if (list.length > 0) return list;
    setLocal(KEYS.CUENTAS, DEFAULT_CUENTAS);
    return DEFAULT_CUENTAS;
  }

  getMovimientos(): MovimientoFinanciero[] {
    return getLocal<MovimientoFinanciero[]>(KEYS.MOVIMIENTOS, []);
  }

  async crearMovimientoFinanciero(data: Partial<MovimientoFinanciero>): Promise<MovimientoFinanciero> {
    const movimientos = this.getMovimientos();
    const cuentas = this.getCuentas();

    const nuevo: MovimientoFinanciero = {
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      cuenta_id: data.cuenta_id || 'caja-chica-01',
      tipo: data.tipo || 'egreso',
      categoria: data.categoria || 'general',
      monto: data.monto || 0,
      concepto: data.concepto || 'Movimiento de Tesorería',
      referencia: data.referencia,
      usuario_registro: data.usuario_registro || 'Tesorero'
    };

    movimientos.unshift(nuevo);
    setLocal(KEYS.MOVIMIENTOS, movimientos);

    // Afectar saldo de cuenta
    const c = cuentas.find(acc => acc.id === nuevo.cuenta_id);
    if (c) {
      if (nuevo.tipo === 'ingreso') {
        c.saldo_actual += nuevo.monto;
      } else {
        c.saldo_actual -= nuevo.monto;
      }
      setLocal(KEYS.CUENTAS, cuentas);
    }

    return nuevo;
  }

  getIngresos(): IngresoRegistro[] {
    return getLocal<IngresoRegistro[]>(KEYS.INGRESOS, []);
  }

  async crearIngreso(data: Partial<IngresoRegistro>): Promise<IngresoRegistro> {
    const list = this.getIngresos();
    const folio = generateAdminFolio('ING', list);

    const nuevo: IngresoRegistro = {
      id: `ing-${Date.now()}`,
      folio,
      fecha: new Date().toISOString(),
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre || 'Cliente General',
      proyecto_id: data.proyecto_id,
      proyecto_nombre: data.proyecto_nombre,
      concepto: data.concepto || 'Cobro / Anticipo',
      monto_total: data.monto_total || 0,
      monto_cobrado: data.monto_cobrado || 0,
      estatus: data.estatus || 'cobrado',
      metodo_pago: data.metodo_pago || 'transferencia',
      cuenta_destino_id: data.cuenta_destino_id,
      referencia_factura: data.referencia_factura,
      usuario_registro: data.usuario_registro || 'Administrador',
      created_at: new Date().toISOString()
    };

    list.unshift(nuevo);
    setLocal(KEYS.INGRESOS, list);

    // Si se cobró y tiene cuenta destino, ingresar a tesorería
    if (nuevo.monto_cobrado > 0 && nuevo.cuenta_destino_id) {
      await this.crearMovimientoFinanciero({
        cuenta_id: nuevo.cuenta_destino_id,
        tipo: 'ingreso',
        categoria: 'cobro_cliente',
        monto: nuevo.monto_cobrado,
        concepto: `Cobro ${nuevo.folio} - ${nuevo.cliente_nombre} (${nuevo.concepto})`,
        referencia: nuevo.referencia_factura || nuevo.folio,
        usuario_registro: nuevo.usuario_registro
      });
    }

    return nuevo;
  }

  getEgresos(): EgresoRegistro[] {
    return getLocal<EgresoRegistro[]>(KEYS.EGRESOS, []);
  }

  async crearEgreso(data: Partial<EgresoRegistro>): Promise<EgresoRegistro> {
    const list = this.getEgresos();
    const folio = generateAdminFolio('EGR', list);

    const nuevo: EgresoRegistro = {
      id: `egr-${Date.now()}`,
      folio,
      fecha: new Date().toISOString(),
      proveedor_id: data.proveedor_id,
      proveedor_nombre: data.proveedor_nombre || 'Proveedor',
      orden_compra_id: data.orden_compra_id,
      folio_oc: data.folio_oc,
      concepto: data.concepto || 'Pago / Egreso',
      monto_total: data.monto_total || 0,
      monto_pagado: data.monto_pagado || 0,
      estatus: data.estatus || 'pagado',
      metodo_pago: data.metodo_pago || 'transferencia',
      cuenta_origen_id: data.cuenta_origen_id,
      referencia_factura: data.referencia_factura,
      usuario_registro: data.usuario_registro || 'Administrador',
      created_at: new Date().toISOString()
    };

    list.unshift(nuevo);
    setLocal(KEYS.EGRESOS, list);

    // Si se pagó y tiene cuenta origen, descontar de tesorería
    if (nuevo.monto_pagado > 0 && nuevo.cuenta_origen_id) {
      await this.crearMovimientoFinanciero({
        cuenta_id: nuevo.cuenta_origen_id,
        tipo: 'egreso',
        categoria: 'pago_proveedor',
        monto: nuevo.monto_pagado,
        concepto: `Pago ${nuevo.folio} - ${nuevo.proveedor_nombre} (${nuevo.concepto})`,
        referencia: nuevo.referencia_factura || nuevo.folio,
        usuario_registro: nuevo.usuario_registro
      });
    }

    return nuevo;
  }

  // ----------------------------------------------------------
  // INTEGRACIÓN COMPLETA DEL MOTOR DE OFICIOS (CERO DUPLICACIÓN)
  // ----------------------------------------------------------
  
  async guardarOficioErp(oficio: OficioData): Promise<OficioData> {
    const today = new Date().toISOString().split('T')[0];
    const updatedRecord: OficioData = {
      ...oficio,
      id: oficio.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ofc-${Date.now()}`),
      fecha: oficio.fecha || today,
      updated_at: new Date().toISOString()
    };

    const list = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const idx = list.findIndex(o => o.folio === updatedRecord.folio || (updatedRecord.id && o.id === updatedRecord.id));
    if (idx >= 0) {
      list[idx] = updatedRecord;
    } else {
      list.unshift(updatedRecord);
    }
    setLocal('esol_oficios_guardados_local', list);

    // Guardar en Supabase (oficios_obra) con todos los campos para visibilidad en CRM ClienteDetail
    try {
      const dbPayload: any = {
        folio: updatedRecord.folio,
        fecha: updatedRecord.fecha,
        lugar: updatedRecord.lugar || 'Tepic, Nayarit',
        presupuesto_id: updatedRecord.presupuestoId || null,
        nombre_obra: updatedRecord.nombreObra || '',
        ubicacion_obra: updatedRecord.ubicacionObra || '',
        cliente_final: updatedRecord.clienteFinal || '',
        tipo_oficio: updatedRecord.tipoOficio || 'libre',
        destinatario_titulo: updatedRecord.destinatarioTitulo || '',
        destinatario_nombre: updatedRecord.destinatarioNombre || '',
        destinatario_cargo: updatedRecord.destinatarioCargo || '',
        destinatario_empresa: updatedRecord.destinatarioEmpresa || '',
        destinatario_atencion: updatedRecord.destinatarioAtencion || '',
        asunto: updatedRecord.asunto || '',
        referencia: updatedRecord.referencia || '',
        vocativo: updatedRecord.vocativo || '',
        antecedentes: updatedRecord.antecedentes || '',
        cuerpo: updatedRecord.cuerpo || '',
        fundamentacion: updatedRecord.fundamentacion || '',
        peticion: updatedRecord.peticion || '',
        despedida: updatedRecord.despedida || '',
        remitente_nombre: updatedRecord.remitenteNombre || 'Manuel de Jesus Fregoso Samaniega',
        remitente_cargo: updatedRecord.remitenteCargo || 'REPRESENTANTE LEGAL',
        remitente_cedula: updatedRecord.remitenteCedula || '',
        empresa_razon_social: updatedRecord.empresaRazonSocial || 'ESOL ENERGIAS',
        empresa_rfc: updatedRecord.empresaRFC || '',
        empresa_domicilio: updatedRecord.empresaDomicilio || 'Tepic, Nayarit, México',
        empresa_telefono: updatedRecord.empresaTelefono || '3112343034',
        empresa_email: updatedRecord.empresaEmail || 'contacto@esolenergias.com',
        ccp: updatedRecord.ccp || [],
        anexos: updatedRecord.anexos || [],
        estado: updatedRecord.estado || 'emitido',
        drive_url: updatedRecord.drive_url || null,
        firma_digital: updatedRecord.firmaDigital || null,
        incluir_firma_digital: updatedRecord.incluirFirmaDigital ?? true,
        datos_json: updatedRecord,
        updated_at: updatedRecord.updated_at
      };

      if (updatedRecord.id && !updatedRecord.id.startsWith('temp-')) {
        dbPayload.id = updatedRecord.id;
      }

      const { error } = await supabase.from('oficios_obra').upsert(dbPayload, { onConflict: 'folio' });
      if (error) {
        console.warn('Error upserting into oficios_obra:', error);
      }
    } catch (e) {
      console.warn('Error guardando oficio en Supabase:', e);
    }

    return updatedRecord;
  }

  async getOficiosCompletos(): Promise<OficioData[]> {
    let list: OficioData[] = [];
    try {
      const { data, error } = await supabase
        .from('oficios_obra')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        list = data.map((d: any) => {
          const jsonExtra = d.datos_json && typeof d.datos_json === 'object' ? d.datos_json : {};
          return {
            id: d.id,
            folio: d.folio || '',
            fecha: d.fecha || '',
            lugar: d.lugar || 'Tepic, Nayarit',
            presupuestoId: d.presupuesto_id || '',
            nombreObra: d.nombre_obra || '',
            ubicacionObra: d.ubicacion_obra || '',
            clienteFinal: d.cliente_final || '',
            tipoOficio: d.tipo_oficio || 'libre',
            destinatarioTitulo: d.destinatario_titulo || '',
            destinatarioNombre: d.destinatario_nombre || '',
            destinatarioCargo: d.destinatario_cargo || '',
            destinatarioEmpresa: d.destinatario_empresa || '',
            destinatarioAtencion: d.destinatario_atencion || '',
            asunto: d.asunto || '',
            referencia: d.referencia || '',
            vocativo: d.vocativo || '',
            antecedentes: d.antecedentes || '',
            cuerpo: d.cuerpo || d.contenido || '',
            fundamentacion: d.fundamentacion || '',
            peticion: d.peticion || '',
            despedida: d.despedida || '',
            partidas: d.partidas || jsonExtra.partidas || undefined,
            mostrarPreciosEnPdf: d.mostrar_precios_en_pdf ?? jsonExtra.mostrarPreciosEnPdf ?? true,
            remitenteNombre: d.remitente_nombre || 'Manuel de Jesus Fregoso Samaniega',
            remitenteCargo: d.remitente_cargo || 'REPRESENTANTE LEGAL',
            remitenteCedula: d.remitente_cedula || '',
            empresaRazonSocial: d.empresa_razon_social || 'ESOL ENERGIAS',
            empresaRFC: d.empresa_rfc || '',
            empresaDomicilio: d.empresa_domicilio || 'Tepic, Nayarit, México',
            empresaTelefono: d.empresa_telefono || '3112343034',
            empresaEmail: d.empresa_email || 'contacto@esolenergias.com',
            ccp: Array.isArray(d.ccp) ? d.ccp : [],
            anexos: Array.isArray(d.anexos) ? d.anexos : [],
            estado: d.estado || 'emitido',
            drive_url: d.drive_url || null,
            firmaDigital: d.firma_digital || undefined,
            incluirFirmaDigital: d.incluir_firma_digital ?? true,
            created_at: d.created_at,
            updated_at: d.updated_at
          };
        });
      }
    } catch (e) {
      console.warn('Error fetching oficios from Supabase:', e);
    }

    const localStr = localStorage.getItem('esol_oficios_guardados_local');
    if (localStr) {
      try {
        const parsed = JSON.parse(localStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (!list.some(o => o.folio === item.folio || (item.id && o.id === item.id))) {
              list.push(item);
            }
          });
        }
      } catch (e) {}
    }
    return list;
  }

  async emitirOficioCentral(
    oficio: OficioData, 
    tipoTramite: string, 
    datosExtra: {
      clienteId?: string;
      clienteNombre?: string;
      proyectoId?: string;
      proyectoNombre?: string;
      proveedorId?: string;
      proveedorNombre?: string;
      partidas?: any[];
      justificacion?: string;
      total?: number;
      numeroFactura?: string;
      numeroRemision?: string;
      solicitanteNombre?: string;
    } = {}
  ): Promise<{ oficio: OficioData; entidadErp?: any }> {
    // 1. Guardar Oficio en oficios_obra (Supabase + localStorage)
    const savedOficio = await this.guardarOficioErp(oficio);
    let entidadErp: any = null;

    // 2. Dual Save según tipo de trámite seleccionado
    try {
      if (tipoTramite === 'solicitud_compra') {
        entidadErp = await this.crearSolicitudCompra({
          cliente_id: datosExtra.clienteId,
          cliente_nombre: datosExtra.clienteNombre || oficio.clienteFinal,
          proyecto_id: datosExtra.proyectoId || oficio.presupuestoId,
          proyecto_nombre: datosExtra.proyectoNombre || oficio.nombreObra,
          solicitante_nombre: datosExtra.solicitanteNombre || oficio.remitenteNombre,
          justificacion: datosExtra.justificacion || oficio.asunto,
          partidas: datosExtra.partidas || [],
          estatus: 'pendiente',
          folio_oficio: savedOficio.folio,
          pdf_url: savedOficio.drive_url
        });
      } else if (tipoTramite === 'orden_compra') {
        entidadErp = await this.crearOrdenCompra({
          proveedor_id: datosExtra.proveedorId || '',
          proveedor_nombre: datosExtra.proveedorNombre || oficio.destinatarioEmpresa || 'Proveedor',
          cliente_id: datosExtra.clienteId,
          cliente_nombre: datosExtra.clienteNombre || oficio.clienteFinal,
          proyecto_id: datosExtra.proyectoId || oficio.presupuestoId,
          proyecto_nombre: datosExtra.proyectoNombre || oficio.nombreObra,
          partidas: datosExtra.partidas || [],
          notas: datosExtra.justificacion || oficio.asunto,
          estatus: 'aprobada',
          folio_oficio: savedOficio.folio,
          pdf_url: savedOficio.drive_url
        });
      } else if (tipoTramite === 'recepcion_mercancia') {
        entidadErp = await this.crearRecepcion({
          proveedor_id: datosExtra.proveedorId,
          proveedor_nombre: datosExtra.proveedorNombre || oficio.destinatarioEmpresa || 'Proveedor',
          cliente_id: datosExtra.clienteId,
          cliente_nombre: datosExtra.clienteNombre || oficio.clienteFinal,
          proyecto_id: datosExtra.proyectoId || oficio.presupuestoId,
          proyecto_nombre: datosExtra.proyectoNombre || oficio.nombreObra,
          numero_factura: datosExtra.numeroFactura,
          numero_remision: datosExtra.numeroRemision,
          recibido_por: datosExtra.solicitanteNombre || oficio.remitenteNombre,
          partidas: datosExtra.partidas || [],
          estatus: 'completa',
          conforme: true,
          observaciones: datosExtra.justificacion || oficio.asunto,
          folio_oficio: savedOficio.folio,
          pdf_url: savedOficio.drive_url
        });
      } else if (tipoTramite === 'solicitud_material') {
        entidadErp = await this.crearSolicitudMaterial({
          cliente_id: datosExtra.clienteId,
          cliente_nombre: datosExtra.clienteNombre || oficio.clienteFinal,
          proyecto_id: datosExtra.proyectoId || oficio.presupuestoId || '',
          proyecto_nombre: datosExtra.proyectoNombre || oficio.nombreObra,
          solicitante_nombre: datosExtra.solicitanteNombre || oficio.remitenteNombre,
          justificacion: datosExtra.justificacion || oficio.asunto,
          partidas: datosExtra.partidas || [],
          estatus: 'pendiente',
          folio_oficio: savedOficio.folio,
          pdf_url: savedOficio.drive_url
        });
      } else if (tipoTramite === 'vale_entrega') {
        entidadErp = await this.crearValeEntrega({
          cliente_id: datosExtra.clienteId,
          cliente_nombre: datosExtra.clienteNombre || oficio.clienteFinal,
          proyecto_id: datosExtra.proyectoId || oficio.presupuestoId || '',
          proyecto_nombre: datosExtra.proyectoNombre || oficio.nombreObra,
          entrega_nombre: oficio.remitenteNombre,
          recibe_nombre: oficio.destinatarioNombre,
          partidas: datosExtra.partidas || [],
          notas: datosExtra.justificacion || oficio.asunto,
          estatus: 'entregado',
          folio_oficio: savedOficio.folio,
          pdf_url: savedOficio.drive_url
        });
      }
    } catch (err) {
      console.error('Error al registrar entidad ERP vinculada:', err);
    }

    return { oficio: savedOficio, entidadErp };
  }

  generarOficioSC(sc: SolicitudCompra): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);
    const partidasTxt = (sc.partidas || []).map((p, i) => `${i + 1}. [${p.cantidad} ${p.unidad}] ${p.descripcion} (Est: $${(p.importe || (p.cantidad * p.precio_unitario)).toLocaleString('es-MX', { minimumFractionDigits: 2 })})`).join('\n');

    return {
      folio,
      fecha: new Date(sc.fecha || Date.now()).toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: sc.proyecto_nombre || 'Suministro General',
      ubicacionObra: 'Instalación en sitio',
      clienteFinal: 'eSol Energías Renovables',
      tipoOficio: 'requisicion_insumos',
      destinatarioTitulo: 'Ing.',
      destinatarioNombre: 'Dirección de Compras y Suministros',
      destinatarioCargo: 'Administración de Adquisiciones',
      destinatarioEmpresa: 'ESOL ENERGIAS',
      asunto: `Requisición de Compra ${sc.folio} - ${sc.proyecto_nombre}`,
      referencia: `Folio Requisición: ${sc.folio}`,
      vocativo: 'Estimada Dirección de Compras:',
      cuerpo: `Por medio de la presente, me dirijo a usted para solicitar formalmente la adquisición de los insumos y materiales que a continuación se detallan, requeridos para el óptimo avance del proyecto "${sc.proyecto_nombre}":\n\n${partidasTxt}\n\nJustificación Técnica:\n${sc.justificacion || 'Materiales requeridos para abastecimiento de obra y continuidad operativa.'}\n\nTotal Estimado: $${sc.total_estimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`,
      despedida: 'Agradeciendo de antemano su atención a la presente solicitud, quedo a sus órdenes para cualquier aclaración técnica.',
      remitenteNombre: sc.solicitante_nombre || 'Manuel de Jesus Fregoso Samaniega',
      remitenteCargo: 'SOLICITANTE DE REQUISICIÓN',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Archivo de Obra', 'Administración General'],
      anexos: [`Copia de Requisición ${sc.folio}`],
      estado: sc.estatus === 'aprobada' || sc.estatus === 'ordenada' ? 'emitido' : 'borrador'
    };
  }

  generarOficioOC(oc: OrdenCompra): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);
    const partidasTxt = (oc.partidas || []).map((p, i) => `${i + 1}. ${p.cantidad} ${p.unidad} - ${p.descripcion} | P.U: $${p.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })} | Importe: $${p.importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`).join('\n');

    return {
      folio,
      fecha: new Date(oc.fecha || Date.now()).toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: oc.proyecto_nombre || 'Abastecimiento de Suministros',
      ubicacionObra: oc.lugar_entrega || 'Almacén Central',
      clienteFinal: oc.proveedor_nombre,
      tipoOficio: 'orden_compra',
      destinatarioTitulo: 'At´n:',
      destinatarioNombre: oc.proveedor_nombre,
      destinatarioCargo: 'Departamento de Ventas y Facturación',
      destinatarioEmpresa: oc.proveedor_nombre,
      asunto: `Orden de Compra ${oc.folio} - Suministro de Materiales`,
      referencia: `Folio OC: ${oc.folio} ${oc.folio_solicitud ? `(Ref. SC: ${oc.folio_solicitud})` : ''}`,
      vocativo: 'Estimados Señores:',
      cuerpo: `Por medio de la presente, formalizamos el pedido de compra correspondiente a los siguientes insumos, sujetos a las condiciones comerciales previamente acordadas:\n\n${partidasTxt}\n\nRESUMEN FINANCIERO:\nSubtotal: $${oc.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\nIVA (16%): $${oc.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\nTOTAL COMPRA: $${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n\nCondiciones de Pago: ${oc.condicion_pago === 'credito' ? `Crédito (${oc.dias_credito} días)` : 'Contado'}\nTiempo de Entrega: ${oc.tiempo_entrega || 'Inmediato'}\nLugar de Entrega: ${oc.lugar_entrega}\n\nNotas adicionales:\n${oc.notas || 'Favor de adjuntar factura electrónica (PDF y XML) y certificado de garantía.'}`,
      despedida: 'Sin otro particular por el momento, confirmamos nuestra orden a la espera de la entrega y factura correspondiente.',
      remitenteNombre: 'Manuel de Jesus Fregoso Samaniega',
      remitenteCargo: 'REPRESENTANTE LEGAL / DIRECCIÓN',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Almacén Central', 'Contabilidad y Cuentas por Pagar'],
      anexos: [`Orden de Compra ${oc.folio}`],
      estado: 'emitido'
    };
  }

  generarOficioRecepcion(rec: RecepcionMercancia): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);
    const partidasTxt = (rec.partidas || []).map((p, i) => `${i + 1}. ${p.descripcion} | Ordenado: ${p.cantidad_ordenada} ${p.unidad} | Recibido: ${p.cantidad_recibida} ${p.unidad} | Estado Físico: ${p.estado_fisico.toUpperCase()}`).join('\n');

    return {
      folio,
      fecha: new Date(rec.fecha_recepcion || Date.now()).toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: `Recepción Almacén (OC: ${rec.folio_oc})`,
      ubicacionObra: 'Almacén Central',
      clienteFinal: rec.proveedor_nombre,
      tipoOficio: 'acta_recepcion',
      destinatarioTitulo: 'At´n:',
      destinatarioNombre: rec.proveedor_nombre,
      destinatarioCargo: 'Control de Envíos y Calidad',
      destinatarioEmpresa: rec.proveedor_nombre,
      asunto: `Acta de Recepción e Inspección Física ${rec.folio}`,
      referencia: `Folio REC: ${rec.folio} | OC: ${rec.folio_oc} | Factura/Remisión: ${rec.numero_factura || rec.numero_remision || 'S/N'}`,
      vocativo: 'A Quien Corresponda:',
      cuerpo: `Hacemos constar que en la fecha indicada se recibió e inspeccionó físicamente en almacén el embarque de insumos amparado bajo la Orden de Compra ${rec.folio_oc}, con el siguiente desglose de conformidad:\n\n${partidasTxt}\n\nDictamen de Conformidad: ${rec.conforme ? 'ACEPTADO DE CONFORMIDAD' : 'CON OBSERVACIONES'}\nRecibido y Verificado por: ${rec.recibido_por}\n\nObservaciones:\n${rec.observaciones || 'Mercancía recibida e inventariada correctamente en sistema Kardex.'}`,
      despedida: 'Se emite la presente constancia para los efectos administrativos, contables y de inventario a que haya lugar.',
      remitenteNombre: rec.recibido_por || 'Encargado de Almacén',
      remitenteCargo: 'CONTROL DE ALMACÉN E INVENTARIOS',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Archivo de Almacén', 'Cuentas por Pagar'],
      anexos: [`Folio Recepción ${rec.folio}`],
      estado: 'emitido'
    };
  }

  generarOficioSM(sm: SolicitudMaterial): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);
    const partidasTxt = (sm.partidas || []).map((p, i) => `${i + 1}. [${p.cantidad_solicitada} ${p.unidad}] ${p.descripcion}`).join('\n');

    return {
      folio,
      fecha: new Date(sm.fecha_solicitud || Date.now()).toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: sm.proyecto_nombre || 'Obra en Proceso',
      ubicacionObra: 'Sitio de Obra',
      clienteFinal: 'eSol Energías Renovables',
      tipoOficio: 'solicitud_material_obra',
      destinatarioTitulo: 'C.',
      destinatarioNombre: 'Encargado de Almacén General',
      destinatarioCargo: 'Despacho de Materiales',
      destinatarioEmpresa: 'ESOL ENERGIAS',
      asunto: `Solicitud de Suministro a Obra ${sm.folio} - ${sm.proyecto_nombre}`,
      referencia: `Folio Solicitud Obra: ${sm.folio}`,
      vocativo: 'Estimado Encargado de Almacén:',
      cuerpo: `Por medio de la presente, solicito la salida y despacho de los materiales e insumos listados a continuación, requeridos para la ejecución técnica de la obra "${sm.proyecto_nombre}":\n\n${partidasTxt}\n\nJustificación / Frente de Trabajo:\n${sm.justificacion || 'Suministros para montaje e instalación eléctrica en obra.'}\n\nSolicitado por: ${sm.solicitante_nombre}`,
      despedida: 'Agradeciendo la pronta preparación y despacho de los insumos requeridos.',
      remitenteNombre: sm.solicitante_nombre || 'Residente de Obra',
      remitenteCargo: 'RESIDENTE / SUPERVISOR DE OBRA',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Control de Obra', 'Almacén Central'],
      anexos: [`Solicitud ${sm.folio}`],
      estado: sm.estatus === 'aprobada' || sm.estatus === 'entregada' ? 'emitido' : 'borrador'
    };
  }

  generarOficioVale(ve: ValeEntrega): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);
    const partidasTxt = (ve.partidas || []).map((p, i) => `${i + 1}. ${p.cantidad_entregada} ${p.unidad} - ${p.descripcion} (Costo: $${(p.importe_total || (p.cantidad_entregada * p.costo_unitario)).toLocaleString('es-MX', { minimumFractionDigits: 2 })})`).join('\n');

    return {
      folio,
      fecha: new Date(ve.fecha_entrega || Date.now()).toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: ve.proyecto_nombre || 'Obra eSol',
      ubicacionObra: 'Entrega en Obra / Almacén',
      clienteFinal: ve.recibe_nombre || 'Residente',
      tipoOficio: 'acta_entrega_material',
      destinatarioTitulo: 'Ing.',
      destinatarioNombre: ve.recibe_nombre || 'Residente de Obra',
      destinatarioCargo: 'Receptor en Obra',
      destinatarioEmpresa: 'ESOL ENERGIAS',
      asunto: `Vale de Salida de Almacén y Entrega a Obra ${ve.folio}`,
      referencia: `Folio Vale: ${ve.folio} ${ve.folio_solicitud ? `(Ref: ${ve.folio_solicitud})` : ''}`,
      vocativo: 'Constancia de Entrega y Custodia:',
      cuerpo: `Por medio del presente documento se hace entrega formal de los insumos y materiales abajo relacionados para su aplicación en el proyecto "${ve.proyecto_nombre}":\n\n${partidasTxt}\n\nCOSTO TOTAL ENTREGADO: $${ve.total_costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n\nEntrega (Almacén): ${ve.entrega_nombre}\nRecibe de Conformidad (Obra): ${ve.recibe_nombre}\n\nNotas:\n${ve.notas || 'Material entregado en perfecto estado para su custodia e instalación en obra.'}`,
      despedida: 'Firmando de conformidad ambas partes en la fecha estipulada.',
      remitenteNombre: ve.entrega_nombre || 'Manuel de Jesus Fregoso Samaniega',
      remitenteCargo: 'CONTROL DE ALMACÉN / DESPACHO',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Archivo de Almacén', 'Control de Costos de Obra'],
      anexos: [`Vale de Entrega ${ve.folio}`],
      estado: 'emitido'
    };
  }

  generarOficioDevolucion(dev: DevolucionMerma): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);

    return {
      folio,
      fecha: new Date(dev.fecha || Date.now()).toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: dev.proyecto_nombre || 'Almacén General',
      ubicacionObra: 'Almacén Central',
      clienteFinal: 'eSol Energías Renovables',
      tipoOficio: 'acta_devolucion_merma',
      destinatarioTitulo: 'C.',
      destinatarioNombre: 'Supervisión de Control y Calidad',
      destinatarioCargo: 'Auditoría de Insumos',
      destinatarioEmpresa: 'ESOL ENERGIAS',
      asunto: `Acta de ${dev.tipo === 'devolucion' ? 'Devolución de Sobrante' : 'Notificación de Merma'} ${dev.folio}`,
      referencia: `Folio Movimiento: ${dev.folio} (Proyecto: ${dev.proyecto_nombre || 'General'})`,
      vocativo: 'A Quien Corresponda:',
      cuerpo: `Se hace constar el registro formal por concepto de ${dev.tipo === 'devolucion' ? 'DEVOLUCIÓN DE MATERIAL SOBRANTE' : 'MERMA / DETERIORO TÉCNICO'} con el siguiente detalle:\n\nMaterial: ${dev.insumo_nombre}\nCantidad: ${dev.cantidad} ${dev.unidad}\nCosto Unitario: $${(dev.costo_unitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\nImporte Afectado: $${((dev.costo_unitario || 0) * dev.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n\nMotivo:\n${dev.motivo || 'Reingreso y balance de inventario por fin de partida.'}\n\nResponsable del Registro: ${dev.responsable}`,
      despedida: 'Se emite la presente para actualización del Kardex y control de pérdidas/reingresos.',
      remitenteNombre: dev.responsable || 'Encargado de Almacén',
      remitenteCargo: 'CONTROL DE ALMACÉN',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Archivo de Almacén', 'Dirección de Operaciones'],
      anexos: [`Acta ${dev.folio}`],
      estado: 'emitido'
    };
  }

  generarOficioCierre(proy: ProyectoReal): OficioData {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);

    return {
      folio,
      fecha: new Date().toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      nombreObra: proy.titulo,
      ubicacionObra: 'Sitio de Proyecto',
      clienteFinal: proy.cliente_nombre,
      tipoOficio: 'acta_entrega_recepcion',
      destinatarioTitulo: 'Estimado(a):',
      destinatarioNombre: proy.cliente_nombre,
      destinatarioCargo: 'Cliente Final / Titular',
      destinatarioEmpresa: proy.cliente_nombre,
      asunto: `Acta de Finiquito y Cierre Técnico-Económico - ${proy.titulo}`,
      referencia: `Proyecto: ${proy.folio || proy.id}`,
      vocativo: 'Estimado Cliente:',
      cuerpo: `Por medio del presente documento, eSol Energías Renovables hace constar la culminación y entrega formal de los trabajos correspondientes al proyecto "${proy.titulo}":\n\nDATOS GENERALES Y BALANCE ECONÓMICO:\nCliente: ${proy.cliente_nombre}\nFolio de Presupuesto: ${proy.folio}\nValor de Venta Total Contratado: $${proy.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\nCosto Directo Ejecutado: $${proy.costo_directo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n\nHabiendo verificado el correcto funcionamiento del sistema y la entrega de garantías y documentación técnica, se procede al cierre administrativo y operativo del contrato.`,
      despedida: 'Agradeciendo su confianza en eSol Energías Renovables para el desarrollo de su proyecto solar.',
      remitenteNombre: 'Manuel de Jesus Fregoso Samaniega',
      remitenteCargo: 'REPRESENTANTE LEGAL',
      empresaRazonSocial: 'ESOL ENERGIAS',
      empresaRFC: '',
      empresaDomicilio: 'Tepic, Nayarit, México',
      empresaTelefono: '3112343034',
      empresaEmail: 'contacto@esolenergias.com',
      ccp: ['Expediente de Obra', 'Dirección General'],
      anexos: [`Finiquito de Proyecto ${proy.folio}`],
      estado: 'emitido'
    };
  }
}

export const adminDbService = new AdminDbService();

