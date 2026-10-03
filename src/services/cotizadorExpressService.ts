import { supabase } from '../context/supabase';
import type { CotizacionExpressData } from '../types/cotizadorExpress';
import { adminDbService } from '../modules/sistema-administrativo/services/adminDbService';

const STORAGE_KEY = 'esol_cotizaciones_express';

export const cotizadorExpressService = {
  // Obtener cotizaciones locales o desde Supabase
  async getCotizaciones(): Promise<CotizacionExpressData[]> {
    try {
      const { data, error } = await supabase
        .from('cotizaciones_express')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const parsed: CotizacionExpressData[] = data.map((item: any) => {
          let extra: any = {};
          if (item.introduccion && typeof item.introduccion === 'string' && item.introduccion.startsWith('{')) {
            try {
              extra = JSON.parse(item.introduccion);
            } catch {}
          }
          return {
            ...item,
            cliente_atencion: item.cliente_atencion || item.cliente_contacto || '',
            cliente_email: item.cliente_email || item.cliente_correo || '',
            condiciones_pago: item.condiciones_pago || item.forma_pago || '',
            notas_comerciales: item.notas_comerciales || item.notas_adicionales || '',
            vocativo: item.vocativo || extra.vocativo || 'Estimado(a) Cliente:',
            descripcion_alcance: item.descripcion_alcance || extra.descripcion_alcance || '',
            condiciones_servicio: item.condiciones_servicio || extra.condiciones_servicio || '',
            metodologia_servicio: item.metodologia_servicio || extra.metodologia_servicio || '',
            condiciones_trabajo: item.condiciones_trabajo || extra.condiciones_trabajo || '',
            responsabilidades_cliente: item.responsabilidades_cliente || extra.responsabilidades_cliente || '',
            exclusiones_garantias: item.exclusiones_garantias || extra.exclusiones_garantias || '',
            remitente_nombre: item.remitente_nombre || extra.remitente_nombre || item.emisor_nombre || '',
            remitente_cargo: item.remitente_cargo || extra.remitente_cargo || item.emisor_cargo || '',
            banco_receptor: item.banco_receptor || extra.banco_receptor || 'BBVA Bancomer Esol Energías',
            cuenta_clabe: item.cuenta_clabe || extra.cuenta_clabe || '',
            descuento: item.descuento || extra.descuento || 0
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    } catch (e) {
      console.warn('Error fetching cotizaciones_express from Supabase, using local cache:', e);
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Generar el siguiente folio oficial COT-ESOL-YYYY-XXX
  generateNextFolio(existing: CotizacionExpressData[]): string {
    const year = new Date().getFullYear();
    const pattern = new RegExp(`^COT-ESOL-${year}-(\\d+)$`, 'i');
    let max = 0;

    existing.forEach(c => {
      if (c.folio) {
        const match = c.folio.match(pattern);
        if (match && match[1]) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > max) max = n;
        }
      }
    });

    return `COT-ESOL-${year}-${String(max + 1).padStart(3, '0')}`;
  },

  // Generar folio borrador provisional
  generateDraftFolio(existing: CotizacionExpressData[]): string {
    const count = existing.filter(c => c.estado === 'borrador').length + 1;
    return `BORR-${String(count).padStart(3, '0')}`;
  },

  // Guardar o actualizar cotización (borrador o emitido)
  async saveCotizacion(cotizacion: CotizacionExpressData): Promise<CotizacionExpressData> {
    const list = await this.getCotizaciones();
    const now = new Date().toISOString();

    const record: CotizacionExpressData = {
      ...cotizacion,
      id: cotizacion.id || `cot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updated_at: now,
      created_at: cotizacion.created_at || now
    };

    // Si pasa a emitido y tiene folio borrador, asignarle folio oficial definitivo
    if (record.estado !== 'borrador' && (!record.folio || record.folio.startsWith('BORR-'))) {
      record.folio = this.generateNextFolio(list);
      record.fecha_emision = record.fecha_emision || now.split('T')[0];
    }

    // Persistir localmente
    const idx = list.findIndex(c => c.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Persistir en Supabase
    try {
      // Intentar primero guardar registro completo
      const { error: fullError } = await supabase
        .from('cotizaciones_express')
        .upsert(record);

      if (fullError) {
        // Si faltan columnas en la tabla remota, guardar con columnas base y guardar el objeto completo serializado en introduccion/partidas
        console.warn('Upsert completo con advertencia, intentando fallback de compatibilidad:', fullError.message);
        const fallbackRecord = {
          id: record.id,
          folio: record.folio,
          estado: record.estado,
          fecha: record.fecha,
          vigencia_dias: record.vigencia_dias,
          lugar: record.lugar,
          cliente_id: record.cliente_id,
          cliente_nombre: record.cliente_nombre,
          cliente_rfc: record.cliente_rfc,
          cliente_contacto: record.cliente_atencion,
          cliente_telefono: record.cliente_telefono,
          cliente_correo: record.cliente_email,
          cliente_direccion: record.cliente_direccion,
          asunto: record.asunto,
          introduccion: JSON.stringify({
            vocativo: record.vocativo,
            descripcion_alcance: record.descripcion_alcance,
            condiciones_servicio: record.condiciones_servicio,
            metodologia_servicio: record.metodologia_servicio,
            condiciones_trabajo: record.condiciones_trabajo,
            responsabilidades_cliente: record.responsabilidades_cliente,
            exclusiones_garantias: record.exclusiones_garantias,
            remitente_nombre: record.remitente_nombre,
            remitente_cargo: record.remitente_cargo,
            banco_receptor: record.banco_receptor,
            cuenta_clabe: record.cuenta_clabe,
            descuento: record.descuento
          }),
          partidas: record.partidas,
          subtotal: record.subtotal,
          iva_porcentaje: record.iva_porcentaje,
          iva_monto: record.iva_monto,
          total: record.total,
          tiempo_entrega: record.tiempo_entrega,
          forma_pago: record.condiciones_pago,
          notas_adicionales: record.notas_comerciales,
          drive_url: record.drive_url,
          tesoreria_ingreso_id: record.ingreso_id,
          updated_at: now
        };
        await supabase.from('cotizaciones_express').upsert(fallbackRecord);
      }
    } catch (err) {
      console.warn('Could not upsert to Supabase cotizaciones_express:', err);
    }

    return record;
  },

  // Eliminar cotización
  async deleteCotizacion(id: string): Promise<void> {
    const list = (await this.getCotizaciones()).filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    try {
      await supabase
        .from('cotizaciones_express')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Could not delete from Supabase cotizaciones_express:', err);
    }
  },

  // Conexión con Tesorería: Generar Cuenta por Cobrar en Ingresos CxC
  async generarCuentaPorCobrar(cotizacion: CotizacionExpressData): Promise<string | null> {
    try {
      const nuevoIngreso = await adminDbService.crearIngreso({
        cliente_id: cotizacion.cliente_id,
        cliente_nombre: cotizacion.cliente_nombre,
        concepto: `${cotizacion.folio}: ${cotizacion.asunto}`,
        monto_total: cotizacion.total,
        monto_cobrado: 0,
        estatus: 'pendiente',
        metodo_pago: 'transferencia',
        referencia_factura: cotizacion.folio,
        usuario_registro: cotizacion.remitente_nombre || 'Asesor Comercial'
      });

      // Actualizar cotización a 'aprobada' con referencia al ingreso
      cotizacion.estado = 'aprobada';
      cotizacion.ingreso_id = nuevoIngreso.id;
      cotizacion.fecha_aprobacion = new Date().toISOString();
      await this.saveCotizacion(cotizacion);

      return nuevoIngreso.folio;
    } catch (err) {
      console.error('Error al generar ingreso en tesorería:', err);
      throw err;
    }
  },

  // Subir PDF a Google Drive a través del webhook de Make o Apps Script
  async uploadToDrive(pdfBlob: Blob, filename: string, cotizacion: CotizacionExpressData): Promise<string | null> {
    const webhookUrl = localStorage.getItem('esol_make_webhook_url') || '';
    if (!webhookUrl || !webhookUrl.includes('http')) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, filename);
      formData.append('filename', filename);
      formData.append('cliente', cotizacion.cliente_nombre || 'Cliente General');
      formData.append('folio', cotizacion.folio);
      formData.append('tipo', 'COTIZACION_FORMAL');
      formData.append('modulo', 'COTIZACIONES');
      formData.append('estado', cotizacion.estado);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let driveUrl: string | null = null;

      try {
        const data = JSON.parse(text);
        driveUrl = data.driveUrl || data.url || null;
      } catch {
        if (text.includes('drive.google.com')) {
          const match = text.match(/https:\/\/drive\.google\.com\/[^\s"']+/);
          if (match) driveUrl = match[0];
        }
      }

      if (driveUrl) {
        cotizacion.drive_url = driveUrl;
        await this.saveCotizacion(cotizacion);
      }

      return driveUrl;
    } catch (err) {
      console.warn('Error subiendo cotización a Drive:', err);
      return null;
    }
  }
};
