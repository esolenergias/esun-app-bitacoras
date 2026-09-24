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

// Default seed Cuentas de Caja/Bancos
export const DEFAULT_CUENTAS: CuentaFinanciera[] = [
  {
    id: 'caja-chica-01',
    nombre: 'Caja Chica Obra / Operativa',
    tipo: 'caja_chica',
    moneda: 'MXN',
    saldo_actual: 25000,
    responsable: 'Administración de Obra',
    activa: true
  },
  {
    id: 'caja-grande-01',
    nombre: 'Caja Grande General Esol',
    tipo: 'caja_grande',
    moneda: 'MXN',
    saldo_actual: 150000,
    responsable: 'Dirección General (Master)',
    activa: true
  },
  {
    id: 'banco-bbva-01',
    nombre: 'BBVA Bancomer Esol Energías',
    tipo: 'banco',
    moneda: 'MXN',
    saldo_actual: 840000,
    responsable: 'Tesorería Esol',
    banco: 'BBVA México',
    numero_cuenta: '0123456789',
    clabe: '012560001234567890',
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
  // 1. CARGA COMPLETA DE DATOS (CONECTADO A BASES REALES)
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

    // Calcular KPIs
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

  // Clientes reales
  async fetchClientesReales(): Promise<ClienteReal[]> {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(c => ({
          id: c.id,
          nombre: c.nombre || 'Cliente sin nombre',
          email: c.email || '',
          telefono: c.telefono || '',
          rfc: c.rfc || '',
          direccion: c.direccion || ''
        }));
      }
    } catch (e) {}

    // Fallback local
    const local = getLocal<any[]>('esol_clientes_cache', []);
    if (local.length > 0) return local;

    return [
      { id: 'cli-001', nombre: 'Agrícola San Juan S.A. de C.V.', email: 'contacto@sanjuan.mx', telefono: '662 123 4567', rfc: 'ASJ900101XX1', direccion: 'Hermosillo, Sonora' },
      { id: 'cli-002', nombre: 'Hotel Playa Dorada Resorts', email: 'gerencia@playadorada.com', telefono: '669 987 6543', rfc: 'HPD120304AA2', direccion: 'Mazatlán, Sinaloa' },
      { id: 'cli-003', nombre: 'Residencial Las Cumbres (Ing. Mendoza)', email: 'mendoza@cumbres.mx', telefono: '662 555 8899', rfc: 'MEFL800512999', direccion: 'Hermosillo, Sonora' }
    ];
  }

  // Proyectos / Presupuestos reales
  async fetchProyectosReales(): Promise<ProyectoReal[]> {
    try {
      const { data, error } = await supabase.from('presupuestos').select(`
        id,
        title,
        folio,
        cliente_id,
        indirect_percentage,
        utility_percentage,
        clientes (nombre),
        presupuesto_conceptos (quantity, cost_price)
      `);

      if (!error && data && data.length > 0) {
        return data.map(p => {
          let cd = 0;
          if (p.presupuesto_conceptos && Array.isArray(p.presupuesto_conceptos)) {
            p.presupuesto_conceptos.forEach((c: any) => {
              cd += (Number(c.quantity) || 0) * (Number(c.cost_price) || 0);
            });
          }
          const indPct = p.indirect_percentage ?? 10.00;
          const utPct = p.utility_percentage ?? 8.00;
          const indCost = cd * (indPct / 100);
          const util = (cd + indCost) * (utPct / 100);
          const totalConIva = (cd + indCost + util) * 1.16;

          return {
            id: p.id,
            titulo: p.title || 'Proyecto Solar',
            folio: p.folio || `PRY-${p.id.slice(0, 6)}`,
            cliente_id: p.cliente_id || '',
            cliente_nombre: p.clientes?.nombre || 'Cliente General',
            total: totalConIva || 150000,
            costo_directo: cd || 95000,
            indirect_percentage: indPct,
            utility_percentage: utPct,
            estatus: 'activo'
          };
        });
      }
    } catch (e) {}

    return [
      { id: 'pry-001', titulo: 'Parque Solar Agrícola 50 kWp', folio: 'PRY-2026-001', cliente_id: 'cli-001', cliente_nombre: 'Agrícola San Juan S.A. de C.V.', total: 680000, costo_directo: 430000, estatus: 'en_proceso' },
      { id: 'pry-002', titulo: 'Sistema Interconectado Comercial 30 kWp', folio: 'PRY-2026-002', cliente_id: 'cli-002', cliente_nombre: 'Hotel Playa Dorada Resorts', total: 420000, costo_directo: 265000, estatus: 'en_proceso' },
      { id: 'pry-003', titulo: 'Instalación Residencial Premium 8.5 kWp', folio: 'PRY-2026-003', cliente_id: 'cli-003', cliente_nombre: 'Residencial Las Cumbres (Ing. Mendoza)', total: 145000, costo_directo: 92000, estatus: 'en_proceso' }
    ];
  }

  // Insumos reales
  async fetchInsumosReales(): Promise<InsumoReal[]> {
    try {
      const { data, error } = await supabase.from('insumos').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(i => ({
          id: i.id,
          nombre: i.name || 'Insumo',
          codigo: i.code || '',
          categoria: i.category || 'General',
          unidad: i.unit || 'PZA',
          precio_unitario: Number(i.price_unit) || 0,
          tipo: i.type || 'material'
        }));
      }
    } catch (e) {}

    return [
      { id: 'ins-001', nombre: 'Módulo Fotovoltaico 550W Monocristalino Tier 1', codigo: 'PAN-550W', categoria: 'Paneles Solares', unidad: 'PZA', precio_unitario: 2650, tipo: 'material' },
      { id: 'ins-002', nombre: 'Inversor Central Trifásico 30 kW 220/440V', codigo: 'INV-30KW', categoria: 'Inversores', unidad: 'PZA', precio_unitario: 52000, tipo: 'material' },
      { id: 'ins-003', nombre: 'Microinversor Cuádruple 2000W', codigo: 'MIC-2000W', categoria: 'Inversores', unidad: 'PZA', precio_unitario: 7800, tipo: 'material' },
      { id: 'ins-004', nombre: 'Riel de Aluminio Anodizado 4.2m', codigo: 'EST-RIEL42', categoria: 'Estructuras', unidad: 'PZA', precio_unitario: 480, tipo: 'material' },
      { id: 'ins-005', nombre: 'Cable Solar Fotovoltaico 1x4mm² Negro (Rollo 100m)', codigo: 'CAB-SOL-4MM', categoria: 'Cable Solar', unidad: 'RLL', precio_unitario: 2100, tipo: 'material' },
      { id: 'ins-006', nombre: 'Par de Conectores MC4 Macho/Hembra IP68', codigo: 'CON-MC4', categoria: 'Accesorios', unidad: 'PAR', precio_unitario: 45, tipo: 'material' }
    ];
  }

  // ----------------------------------------------------------
  // PROVEEDORES
  // ----------------------------------------------------------
  getProveedores(): Proveedor[] {
    const list = getLocal<Proveedor[]>(KEYS.PROVEEDORES, []);
    if (list.length > 0) return list;

    const defaultProv: Proveedor[] = [
      { id: 'prov-001', nombre: 'Distribuidora Solar del Noroeste S.A.', rfc: 'DSN180901XX1', contacto_nombre: 'Ing. Carlos Morales', telefono: '662 111 2233', email: 'ventas@solarnoroeste.mx', direccion: 'Blvd. Encinas 400, Hermosillo', dias_credito: 30, limite_credito: 250000, categoria_principal: 'Paneles Solares e Inversores' },
      { id: 'prov-002', nombre: 'Estructuras y Perfiles de Aluminio de México', rfc: 'EPM150420AA9', contacto_nombre: 'Lic. Mariana Vega', telefono: '55 5890 1234', email: 'contacto@estructurasaluminio.com', direccion: 'Parque Industrial Tlalnepantla, CDMX', dias_credito: 15, limite_credito: 100000, categoria_principal: 'Estructuras de Montaje' },
      { id: 'prov-003', nombre: 'Conductores y Cables Eléctricos del Pacífico', rfc: 'CCE190708TT4', contacto_nombre: 'Roberto Leyva', telefono: '667 712 9900', email: 'pedidos@conductorespacifico.com', direccion: 'Culiacán, Sinaloa', dias_credito: 30, limite_credito: 120000, categoria_principal: 'Cables e Insumos Eléctricos' }
    ];
    setLocal(KEYS.PROVEEDORES, defaultProv);
    return defaultProv;
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

  // ----------------------------------------------------------
  // SOLICITUDES DE COMPRA (Paso 1 y 2)
  // ----------------------------------------------------------
  getSolicitudesCompra(): SolicitudCompra[] {
    return getLocal<SolicitudCompra[]>(KEYS.SOLICITUDES_COMPRA, []);
  }

  async crearSolicitudCompra(data: Partial<SolicitudCompra>, insumos: InsumoReal[] = []): Promise<SolicitudCompra> {
    const list = this.getSolicitudesCompra();
    const folio = generateAdminFolio('SC', list);
    const total = (data.partidas || []).reduce((acc, it) => acc + (it.importe || (it.cantidad * it.precio_unitario)), 0);

    const nueva: SolicitudCompra = {
      id: `sc-${Date.now()}`,
      folio,
      fecha: new Date().toISOString(),
      proyecto_id: data.proyecto_id,
      proyecto_nombre: data.proyecto_nombre || 'General',
      solicitante_nombre: data.solicitante_nombre || 'Residente',
      justificacion: data.justificacion || '',
      partidas: data.partidas || [],
      total_estimado: total,
      estatus: 'pendiente',
      created_at: new Date().toISOString()
    };

    list.unshift(nueva);
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
    const folio = generateAdminFolio('OC', list);
    const subtotal = (data.partidas || []).reduce((acc, it) => acc + (it.importe || (it.cantidad * it.precio_unitario)), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const nueva: OrdenCompra = {
      id: `oc-${Date.now()}`,
      folio,
      fecha: new Date().toISOString(),
      solicitud_compra_id: data.solicitud_compra_id,
      folio_solicitud: data.folio_solicitud,
      proveedor_id: data.proveedor_id || 'prov-001',
      proveedor_nombre: data.proveedor_nombre || 'Proveedor',
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
      estatus: 'aprobada',
      notas: data.notas || '',
      created_at: new Date().toISOString()
    };

    list.unshift(nueva);
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
    const folio = generateAdminFolio('REC', list);

    const nueva: RecepcionMercancia = {
      id: `rec-${Date.now()}`,
      folio,
      fecha_recepcion: new Date().toISOString(),
      orden_compra_id: data.orden_compra_id || '',
      folio_oc: data.folio_oc || '',
      proveedor_id: data.proveedor_id,
      proveedor_nombre: data.proveedor_nombre || 'Proveedor',
      numero_factura: data.numero_factura,
      numero_remision: data.numero_remision,
      recibido_por: data.recibido_por || 'Encargado de Almacén',
      partidas: data.partidas || [],
      estatus: data.estatus || 'completa',
      conforme: data.conforme !== undefined ? data.conforme : true,
      observaciones: data.observaciones,
      created_at: new Date().toISOString()
    };

    list.unshift(nueva);
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
            stock_minimo: 5,
            precio_promedio: p.precio_unitario || 100
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

    // Seed inicial si está vacío basado en el catálogo maestro de insumos
    const seeded: ItemInventario[] = catalogoInsumos.map(ins => ({
      insumo_id: ins.id,
      codigo: ins.codigo,
      nombre: ins.nombre,
      categoria: ins.categoria,
      unidad: ins.unidad,
      stock_actual: ins.categoria === 'Paneles Solares' ? 48 : ins.categoria === 'Inversores' ? 6 : 100,
      stock_minimo: 10,
      precio_promedio: ins.precio_unitario,
      marca: 'Esol Tech'
    }));

    setLocal(KEYS.INVENTARIO, seeded);
    return seeded;
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
    const folio = generateAdminFolio('SM', list);

    const nueva: SolicitudMaterial = {
      id: `sm-${Date.now()}`,
      folio,
      fecha_solicitud: new Date().toISOString(),
      proyecto_id: data.proyecto_id || '',
      proyecto_nombre: data.proyecto_nombre || 'Proyecto Obra',
      solicitante_nombre: data.solicitante_nombre || 'Residente de Obra',
      justificacion: data.justificacion,
      partidas: data.partidas || [],
      estatus: 'pendiente',
      created_at: new Date().toISOString()
    };

    list.unshift(nueva);
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
    const folio = generateAdminFolio('VE', list);

    const totalCosto = (data.partidas || []).reduce((acc, it) => acc + (it.importe_total || (it.cantidad_entregada * it.costo_unitario)), 0);

    const nuevo: ValeEntrega = {
      id: `ve-${Date.now()}`,
      folio,
      fecha_entrega: new Date().toISOString(),
      solicitud_material_id: data.solicitud_material_id || '',
      folio_solicitud: data.folio_solicitud || '',
      proyecto_id: data.proyecto_id || '',
      proyecto_nombre: data.proyecto_nombre || 'Obra',
      entrega_nombre: data.entrega_nombre || 'Almacenista',
      recibe_nombre: data.recibe_nombre || 'Residente',
      partidas: data.partidas || [],
      total_costo: totalCosto,
      estatus: 'entregado',
      notas: data.notas,
      created_at: new Date().toISOString()
    };

    list.unshift(nuevo);
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
  // INTEGRACIÓN CON EL MOTOR DE OFICIOS (1-CLICK)
  // ----------------------------------------------------------
  async crearOficioDesdeSolicitud(params: {
    tipo: 'compra' | 'material' | 'entrega';
    folio_referencia: string;
    destinatario: string;
    asunto: string;
    cuerpo: string;
    solicitante_nombre: string;
  }): Promise<OficioData> {
    const oficiosLocal = getLocal<OficioData[]>('esol_oficios_guardados_local', []);
    const folio = getNextFolio(oficiosLocal);

    const nuevoOficio: OficioData = {
      folio,
      fecha: new Date().toISOString().split('T')[0],
      lugar: 'Hermosillo, Sonora',
      nombreObra: params.asunto,
      ubicacionObra: 'Instalación en sitio',
      clienteFinal: params.destinatario,
      tipoOficio: params.tipo === 'compra' ? 'Requisición de Materiales' : params.tipo === 'entrega' ? 'Acta de Entrega de Obra' : 'Solicitud de Insumos',
      destinatarioTitulo: 'C.',
      destinatarioNombre: params.destinatario,
      destinatarioCargo: 'Responsable',
      destinatarioEmpresa: 'eSol Energías Renovables',
      asunto: params.asunto,
      referencia: params.folio_referencia,
      vocativo: 'Estimado(a) Responsable:',
      cuerpo: params.cuerpo,
      despedida: 'Sin otro particular por el momento, quedo a sus órdenes para cualquier aclaración al respecto.',
      remitenteNombre: params.solicitante_nombre,
      remitenteCargo: 'Administración y Control de Obra',
      empresaRazonSocial: 'eSol Energías Renovables S.A. de C.V.',
      empresaRFC: 'EER190415AA1',
      empresaDomicilio: 'Hermosillo, Sonora, México',
      empresaTelefono: '662 100 2030',
      empresaEmail: 'admin@esun.mx',
      ccp: ['Archivo de Almacén', 'Dirección General'],
      anexos: [`Copia de Folio ${params.folio_referencia}`],
      estado: 'emitido'
    };

    oficiosLocal.unshift(nuevoOficio);
    setLocal('esol_oficios_guardados_local', oficiosLocal);
    localStorage.setItem('esol_oficio_editing_target', nuevoOficio.folio);
    localStorage.setItem('esol_legal_active_subtab', 'oficios');

    // Sincronizar con Supabase si está disponible
    try {
      await supabase.from('oficios_obra').insert([
        {
          folio: nuevoOficio.folio,
          tipo_oficio: nuevoOficio.tipoOficio,
          nombre_obra: nuevoOficio.nombreObra,
          destinatario_nombre: nuevoOficio.destinatarioNombre,
          asunto: nuevoOficio.asunto,
          contenido: nuevoOficio.cuerpo,
          estado: nuevoOficio.estado,
          datos_json: nuevoOficio
        }
      ]);
    } catch (e) {}

    return nuevoOficio;
  }
}

export const adminDbService = new AdminDbService();
