import { supabase } from '../../context/supabase';
import type { VisitaTecnica } from './types';

const LOCAL_STORAGE_KEY = 'esol_visitas_tecnicas_cache';

// Helper to get cached items from localStorage
function getLocalCache(): VisitaTecnica[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading visitas cache:', e);
    return [];
  }
}

// Helper to save cache to localStorage
function setLocalCache(items: VisitaTecnica[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error writing visitas cache:', e);
  }
}

export const visitasService = {
  /**
   * Generates next consecutive official folio: ESOL-VT-YYYY-XXXX
   */
  generateFolio(existingVisitas: VisitaTecnica[] = []): string {
    const year = new Date().getFullYear();
    const prefix = `ESOL-VT-${year}-`;
    
    // Find highest folio number for this year
    let maxNum = 0;
    existingVisitas.forEach(v => {
      if (v.folio && v.folio.startsWith(prefix)) {
        const numPart = parseInt(v.folio.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },

  /**
   * Fetch all visitas técnicas from Supabase with fallback to local cache
   */
  async fetchVisitas(): Promise<{ visitas: VisitaTecnica[]; isLocalOnly: boolean }> {
    try {
      const { data, error } = await supabase
        .from('visitas_tecnicas')
        .select('*')
        .order('fecha_visita', { ascending: false });

      if (error) {
        console.warn('Supabase visitas_tecnicas query warning, using local cache:', error.message);
        return { visitas: getLocalCache(), isLocalOnly: true };
      }

      const remoteVisitas: VisitaTecnica[] = (data || []).map((row: any) => ({
        id: row.id,
        folio: row.folio,
        fecha_visita: row.fecha_visita,
        fecha_expedicion: row.fecha_expedicion,
        tipo_visita: row.tipo_visita,
        estado: row.estado || 'completada',
        es_obra_existente: row.es_obra_existente ?? true,
        obra_nombre: row.obra_nombre || '',
        presupuesto_id: row.presupuesto_id || null,
        cliente_id: row.cliente_id || null,
        cliente_nombre: row.cliente_nombre || '',
        sitio_nombre: row.sitio_nombre || '',
        ubicacion: row.ubicacion || '',
        coordenadas_gps: row.coordenadas_gps || null,
        elaboro_nombre: row.elaboro_nombre || '',
        elaboro_cargo: row.elaboro_cargo || '',
        elaboro_telefono: row.elaboro_telefono || '',
        recibe_nombre: row.recibe_nombre || '',
        recibe_cargo: row.recibe_cargo || '',
        recibe_telefono: row.recibe_telefono || '',
        descripcion: row.descripcion || '',
        puntos_clave: Array.isArray(row.puntos_clave) ? row.puntos_clave : [],
        parametros_tecnicos: row.parametros_tecnicos || {},
        recomendaciones: row.recomendaciones || '',
        siguientes_pasos: row.siguientes_pasos || '',
        fotografias: Array.isArray(row.fotografias) ? row.fotografias : [],
        firma_elaboro: row.firma_elaboro || null,
        firma_recibe: row.firma_recibe || null,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      // Update local cache for offline/fast resilience
      setLocalCache(remoteVisitas);
      return { visitas: remoteVisitas, isLocalOnly: false };
    } catch (err) {
      console.error('Error fetching visitas_tecnicas, returning local cache:', err);
      return { visitas: getLocalCache(), isLocalOnly: true };
    }
  },

  /**
   * Save (Insert or Update) a visita técnica
   */
  async saveVisita(visita: VisitaTecnica): Promise<{ success: boolean; data: VisitaTecnica; error?: string }> {
    const payload = {
      folio: visita.folio,
      fecha_visita: visita.fecha_visita,
      fecha_expedicion: visita.fecha_expedicion || new Date().toISOString().split('T')[0],
      tipo_visita: visita.tipo_visita,
      estado: visita.estado || 'completada',
      es_obra_existente: visita.es_obra_existente,
      obra_nombre: visita.obra_nombre || null,
      presupuesto_id: visita.presupuesto_id || null,
      cliente_id: visita.cliente_id || null,
      cliente_nombre: visita.cliente_nombre,
      sitio_nombre: visita.sitio_nombre,
      ubicacion: visita.ubicacion,
      coordenadas_gps: visita.coordenadas_gps || null,
      elaboro_nombre: visita.elaboro_nombre,
      elaboro_cargo: visita.elaboro_cargo,
      elaboro_telefono: visita.elaboro_telefono || null,
      recibe_nombre: visita.recibe_nombre,
      recibe_cargo: visita.recibe_cargo,
      recibe_telefono: visita.recibe_telefono || null,
      descripcion: visita.descripcion,
      puntos_clave: visita.puntos_clave || [],
      parametros_tecnicos: visita.parametros_tecnicos || {},
      recomendaciones: visita.recomendaciones || null,
      siguientes_pasos: visita.siguientes_pasos || null,
      fotografias: visita.fotografias || [],
      firma_elaboro: visita.firma_elaboro || null,
      firma_recibe: visita.firma_recibe || null,
      updated_at: new Date().toISOString()
    };

    // Update local cache first
    const cache = getLocalCache();
    let savedLocal = { ...visita };
    const existingIndex = cache.findIndex(v => v.id === visita.id || v.folio === visita.folio);
    
    if (existingIndex >= 0) {
      cache[existingIndex] = { ...savedLocal, updated_at: new Date().toISOString() };
    } else {
      cache.unshift(savedLocal);
    }
    setLocalCache(cache);

    try {
      if (visita.id && !visita.id.startsWith('local_')) {
        // Update existing record
        const { data, error } = await supabase
          .from('visitas_tecnicas')
          .update(payload)
          .eq('id', visita.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: { ...visita, ...data } };
      } else {
        // Insert new record
        const insertPayload: any = { ...payload };
        // If it was a client-generated local id, omit it so Postgres generates UUID
        if (visita.id && !visita.id.startsWith('local_')) {
          insertPayload.id = visita.id;
        }

        const { data, error } = await supabase
          .from('visitas_tecnicas')
          .insert([insertPayload])
          .select()
          .single();

        if (error) throw error;

        // Update local cache with newly assigned remote ID
        if (data && data.id) {
          const updatedCache = getLocalCache().map(v => v.folio === visita.folio ? { ...v, id: data.id } : v);
          setLocalCache(updatedCache);
          return { success: true, data: { ...visita, id: data.id } };
        }
        return { success: true, data: visita };
      }
    } catch (err: any) {
      console.warn('Could not save to Supabase visitas_tecnicas (saved locally in cache):', err?.message);
      return { success: true, data: savedLocal, error: err?.message };
    }
  },

  /**
   * Delete a visita técnica
   */
  async deleteVisita(id: string): Promise<boolean> {
    // Delete from local cache
    const cache = getLocalCache().filter(v => v.id !== id);
    setLocalCache(cache);

    try {
      if (!id.startsWith('local_')) {
        const { error } = await supabase
          .from('visitas_tecnicas')
          .delete()
          .eq('id', id);
        if (error) console.warn('Supabase delete warning:', error.message);
      }
      return true;
    } catch (err) {
      console.error('Error deleting from Supabase:', err);
      return true;
    }
  },

  /**
   * Fetch ecosystem context: Obras, Presupuestos, Clientes for autocompletion
   */
  async fetchEcosystemData(): Promise<{
    obras: Array<{ nombre: string; cliente: string; ubicacion: string; residente?: string; status?: string }>;
    presupuestos: Array<{ id: string; name: string; client_name: string; ubicacion: string; status: string }>;
    clientes: Array<{ id: string; nombre_razon_social: string; telefono?: string; email?: string }>;
  }> {
    const results = {
      obras: [] as any[],
      presupuestos: [] as any[],
      clientes: [] as any[]
    };

    try {
      const [obrasRes, presRes, clientesRes] = await Promise.all([
        supabase.from('obras_app').select('nombre, cliente, ubicacion, residente, status').order('created_at', { ascending: false }),
        supabase.from('presupuestos').select('id, name, client_name, ubicacion, status').order('created_at', { ascending: false }),
        supabase.from('clientes').select('id, nombre_razon_social, telefono, email').order('nombre_razon_social', { ascending: true })
      ]);

      if (obrasRes.data) results.obras = obrasRes.data;
      if (presRes.data) results.presupuestos = presRes.data;
      if (clientesRes.data) results.clientes = clientesRes.data;
    } catch (e) {
      console.error('Error fetching ecosystem context data:', e);
    }

    return results;
  }
};
