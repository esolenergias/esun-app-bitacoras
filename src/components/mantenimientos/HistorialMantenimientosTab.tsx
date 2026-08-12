import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { HardHat, Search, Calendar, MapPin, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import ExpedienteMantenimiento from './ExpedienteMantenimiento';

export default function HistorialMantenimientosTab({ reporterName = 'ESOL Técnico' }: { reporterName?: string }) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisita, setSelectedVisita] = useState<any>(null);

  const fetchHistorial = async () => {
    setLoading(true);
    // Fetch completed visits and join with polizas_garantia
    const { data, error } = await supabase
      .from('visitas_mantenimiento_poliza')
      .select(`
        *,
        poliza:poliza_id (
          id,
          folio,
          nombre_obra,
          cliente_nombre,
          cliente_direccion,
          cliente_telefono,
          cliente_email,
          conceptos_incluidos,
          tipo_cobertura,
          periodicidad,
          duracion_anos,
          fecha_inicio,
          fecha_fin,
          monto_total,
          estado_mantenimiento,
          fecha_proximo_mantenimiento,
          modalidad_contratacion
        )
      `)
      .in('estado', ['completada', 'Completada', 'COMPLETADA'])
      .order('fecha_realizada', { ascending: false });

    if (!error && data) {
      setHistorial(data);
    } else {
      console.error("Error fetching historial:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const filteredHistorial = historial.filter(item => {
    const s = searchTerm.toLowerCase();
    const obra = item.poliza?.nombre_obra?.toLowerCase() || '';
    const cliente = item.poliza?.cliente_nombre?.toLowerCase() || '';
    const folio = item.poliza?.folio?.toLowerCase() || '';
    return obra.includes(s) || cliente.includes(s) || folio.includes(s);
  });

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'Sin fecha';
    return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (selectedVisita) {
    return (
      <ExpedienteMantenimiento 
        obra={selectedVisita.poliza} 
        reporterName={reporterName}
        onBack={() => {
          setSelectedVisita(null);
          fetchHistorial(); // Refetch just in case
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
          <input 
            type="text" 
            placeholder="Buscar en el historial (folio, cliente u obra)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-sm text-cream pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-cream-muted text-sm">Cargando historial...</p>
        </div>
      ) : filteredHistorial.length === 0 ? (
        <div className="border border-dark-4 bg-dark-2/40 p-16 rounded-2xl text-center space-y-4 select-none">
          <HardHat className="w-10 h-10 text-gold mx-auto opacity-50" />
          <h4 className="font-display font-black text-base text-cream">Historial Limpio</h4>
          <p className="text-xs text-cream-muted max-w-sm mx-auto font-body">
            No se encontraron mantenimientos completados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistorial.map((visita) => (
            <div 
              key={visita.id} 
              className="bg-dark-2 border border-dark-4 rounded-xl p-4 hover:border-gold/30 transition-colors cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              onClick={() => setSelectedVisita(visita)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold font-display text-gold/80 px-2 py-0.5 bg-gold/10 rounded border border-gold/20">
                      VISITA #{visita.numero_visita}
                    </span>
                    <span className="text-xs text-cream-muted font-medium bg-dark-3 px-2 py-0.5 rounded border border-dark-4">
                      {visita.poliza?.folio || 'Sin folio'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-cream group-hover:text-gold transition-colors line-clamp-1">
                    {visita.poliza?.nombre_obra || 'Obra desconocida'}
                  </h3>
                  <p className="text-xs text-cream-muted mt-0.5 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3 h-3" /> {visita.poliza?.cliente_nombre || 'Cliente desconocido'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t border-dark-4 sm:border-0 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-cream-muted uppercase font-bold tracking-wider mb-0.5 flex items-center sm:justify-end gap-1">
                    <Clock className="w-3 h-3" /> Realizada
                  </p>
                  <p className="text-sm text-emerald-400 font-medium">
                    {visita.fecha_realizada ? formatFecha(visita.fecha_realizada) : 'N/A'}
                  </p>
                </div>
                <div className="bg-dark-3 p-2 rounded-lg text-cream-muted group-hover:text-gold group-hover:bg-gold/10 transition-colors shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
