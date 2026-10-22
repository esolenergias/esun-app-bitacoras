import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, Calendar, MapPin, 
  User, Building, CheckCircle, Clock, AlertTriangle, 
  Trash2, Edit3, Printer, RefreshCw, Eye, Sparkles, Camera, ShieldCheck, Loader2
} from 'lucide-react';
import type { VisitaTecnica, TipoVisita, EstadoVisita, FiltrosVisitas } from './types';
import { visitasService } from './visitasService';
import { VisitaTecnicaModal } from './VisitaTecnicaModal';
import { VisitaTecnicaPreviewModal } from './VisitaTecnicaPreviewModal';
import { generateVisitaTecnicaPdf } from './visitaTecnicaPdf';
import { useApp } from '../../context/AppContext';
import { auditService } from '../../services/auditService';

export const VisitasTecnicasTab: React.FC = () => {
  const { currentUser } = useApp();

  // State
  const [visitas, setVisitas] = useState<VisitaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState<VisitaTecnica | null>(null);
  const [previewVisita, setPreviewVisita] = useState<VisitaTecnica | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // Filters State
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Load visitas
  const loadData = async () => {
    setLoading(true);
    try {
      const { visitas: data, isLocalOnly: localMode } = await visitasService.fetchVisitas();
      setVisitas(data);
      setIsLocalOnly(localMode);
    } catch (e) {
      console.error('Error loading visitas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered List
  const filteredVisitas = useMemo(() => {
    return visitas.filter(v => {
      // Search text
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matches = 
          v.folio?.toLowerCase().includes(q) ||
          v.sitio_nombre?.toLowerCase().includes(q) ||
          v.cliente_nombre?.toLowerCase().includes(q) ||
          v.ubicacion?.toLowerCase().includes(q) ||
          v.obra_nombre?.toLowerCase().includes(q) ||
          v.elaboro_nombre?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filter by type
      if (filtroTipo !== 'todos' && v.tipo_visita !== filtroTipo) {
        return false;
      }

      // Filter by status
      if (filtroEstado !== 'todos' && v.estado !== filtroEstado) {
        return false;
      }

      return true;
    });
  }, [visitas, busqueda, filtroTipo, filtroEstado]);

  // Statistics
  const stats = useMemo(() => {
    const total = visitas.length;
    const levantamientos = visitas.filter(v => v.tipo_visita === 'Levantamiento Fotovoltaico').length;
    const supervisiones = visitas.filter(v => v.tipo_visita === 'Supervisión de Avance').length;
    const requierenPresupuesto = visitas.filter(v => v.estado === 'requiere_presupuesto').length;
    return { total, levantamientos, supervisiones, requierenPresupuesto };
  }, [visitas]);

  // Handlers
  const handleOpenNew = () => {
    setEditingVisita(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (visita: VisitaTecnica) => {
    setEditingVisita(visita);
    setIsModalOpen(true);
  };

  const handleDelete = async (visita: VisitaTecnica) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el reporte ${visita.folio} (${visita.sitio_nombre})?`)) {
      return;
    }
    const ok = await visitasService.deleteVisita(visita.id);
    if (ok) {
      setVisitas(prev => prev.filter(v => v.id !== visita.id));
      auditService.log({
        action: 'DELETE',
        module: 'Visitas Técnicas',
        description: `Eliminó la visita técnica ${visita.folio} de ${visita.sitio_nombre}`,
        user: currentUser
      });
    }
  };

  const handleSave = async (visitaToSave: VisitaTecnica, generatePdf = false) => {
    const result = await visitasService.saveVisita(visitaToSave);
    if (result.success) {
      await loadData();
      auditService.log({
        action: editingVisita ? 'UPDATE' : 'CREATE',
        module: 'Visitas Técnicas',
        description: `${editingVisita ? 'Actualizó' : 'Creó'} la visita técnica ${visitaToSave.folio} (${visitaToSave.sitio_nombre})`,
        user: currentUser
      });

      if (generatePdf) {
        generateVisitaTecnicaPdf(result.data);
      }
    }
  };

  const handleGeneratePdf = async (visita: VisitaTecnica) => {
    setGeneratingPdfId(visita.id);
    try {
      auditService.log({
        action: 'EXPORT',
        module: 'Visitas Técnicas',
        description: `Generó PDF de visita técnica ${visita.folio}`,
        user: currentUser
      });
      await generateVisitaTecnicaPdf(visita);
    } catch (e) {
      console.error('Error in handleGeneratePdf:', e);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-2/90 border border-dark-4 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gold/10 text-gold border border-gold/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Módulo Oficial de Campo
            </span>
            {isLocalOnly && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Modo Local Seguro
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-cream flex items-center gap-2">
            Visitas Técnicas & Levantamientos
          </h1>
          <p className="text-xs text-cream-muted mt-1 max-w-2xl">
            Generación y control de reportes técnicos de inspección en sitio, levantamientos fotovoltaicos, evidencia fotográfica y dictámenes oficiales de ingeniería con formato de Bitácora.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 transition-all cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-gold/20 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Nueva Visita Técnica
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl shadow-md">
          <div className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Total Visitas</div>
          <div className="text-2xl font-black text-cream mt-1 font-mono">{stats.total}</div>
          <div className="text-[10px] text-cream-muted/70 mt-1 flex items-center gap-1">
            <FileText className="w-3 h-3 text-gold" /> Reportes registrados
          </div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl shadow-md">
          <div className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Levantamientos Solares</div>
          <div className="text-2xl font-black text-gold mt-1 font-mono">{stats.levantamientos}</div>
          <div className="text-[10px] text-cream-muted/70 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold" /> Prospección técnica
          </div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl shadow-md">
          <div className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Supervisión de Obra</div>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{stats.supervisiones}</div>
          <div className="text-[10px] text-cream-muted/70 mt-1 flex items-center gap-1">
            <Building className="w-3 h-3 text-blue-400" /> Control de avance
          </div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl shadow-md">
          <div className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Requieren Cotización</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{stats.requierenPresupuesto}</div>
          <div className="text-[10px] text-cream-muted/70 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Pendientes comercial
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl shadow-md flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cream-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por folio, cliente, predio, obra, ubicación o técnico..."
            className="w-full bg-dark-3 border border-dark-4 rounded-xl pl-9 pr-4 py-2 text-xs text-cream focus:border-gold outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-dark-3 border border-dark-4 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-cream-muted" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-transparent text-xs text-cream border-none outline-none cursor-pointer"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Levantamiento Fotovoltaico">Levantamiento Fotovoltaico</option>
              <option value="Inspección Técnica Preliminar">Inspección Preliminar</option>
              <option value="Supervisión de Avance">Supervisión de Avance</option>
              <option value="Entrega y Recepción de Obra">Entrega de Obra</option>
              <option value="Diagnóstico y Detección de Fallas">Diagnóstico de Fallas</option>
              <option value="Factibilidad de Interconexión CFE">Factibilidad CFE</option>
              <option value="Mantenimiento Preventivo / Correctivo">Mantenimiento</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-dark-3 border border-dark-4 rounded-xl px-2.5 py-1">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-xs text-cream border-none outline-none cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="completada">Completada</option>
              <option value="borrador">Borrador</option>
              <option value="en_revision">En Revisión</option>
              <option value="requiere_presupuesto">Requiere Cotización</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitas List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
          <div className="text-xs font-bold text-cream-muted uppercase tracking-wider">
            Cargando visitas técnicas...
          </div>
        </div>
      ) : filteredVisitas.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-dark-4 rounded-2xl bg-dark-2/40 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-cream">
              {visitas.length === 0 ? 'No hay reportes de visita técnica registrados' : 'No se encontraron resultados'}
            </h3>
            <p className="text-xs text-cream-muted mt-1 max-w-md mx-auto">
              {visitas.length === 0 
                ? 'Comienza generando el primer reporte de levantamiento o inspección técnica oficial de ESOL.'
                : 'Intenta ajustar los filtros de búsqueda para localizar el reporte.'}
            </p>
          </div>
          {visitas.length === 0 && (
            <button
              onClick={handleOpenNew}
              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-gold/20"
            >
              <Plus className="w-4 h-4" />
              Crear Primera Visita Técnica
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVisitas.map(visita => {
            const fotosCount = visita.fotografias?.length || 0;
            const puntosCount = visita.puntos_clave?.length || 0;

            const estadoBadge = {
              completada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              borrador: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
              en_revision: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              requiere_presupuesto: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }[visita.estado] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

            const estadoLabel = {
              completada: 'Completada',
              borrador: 'Borrador',
              en_revision: 'En Revisión',
              requiere_presupuesto: 'Requiere Cotización'
            }[visita.estado] || visita.estado;

            return (
              <div
                key={visita.id}
                className="bg-dark-2 border border-dark-4 hover:border-gold/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group hover:-translate-y-0.5 duration-200"
              >
                <div>
                  {/* Top Bar: Folio & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-black text-gold bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20">
                      {visita.folio}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${estadoBadge}`}>
                      {estadoLabel}
                    </span>
                  </div>

                  {/* Site & Client Title */}
                  <h3 className="text-sm font-black text-cream line-clamp-1 group-hover:text-gold transition-colors">
                    {visita.sitio_nombre}
                  </h3>
                  <div className="text-xs text-cream-muted font-medium flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
                    <span className="truncate">{visita.cliente_nombre}</span>
                  </div>

                  {/* Association Tag */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {visita.es_obra_existente && visita.obra_nombre ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-dark-3 text-cream-muted border border-dark-4">
                        <Building className="w-3 h-3 text-gold" />
                        Obra: {visita.obra_nombre}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-dark-3 text-cream-muted border border-dark-4">
                        <User className="w-3 h-3 text-cream-muted" />
                        Cliente Independiente
                      </span>
                    )}

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gold/5 text-gold-light border border-gold/10">
                      {visita.tipo_visita}
                    </span>
                  </div>

                  {/* Ubicación */}
                  {visita.ubicacion && (
                    <div className="text-[11px] text-cream-muted/80 flex items-start gap-1.5 mt-2.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-cream-muted flex-shrink-0 mt-0.5" />
                      <span>{visita.ubicacion}</span>
                    </div>
                  )}

                  {/* Description snippet */}
                  <p className="text-xs text-cream-muted mt-2.5 line-clamp-2 leading-relaxed bg-dark-3/40 p-2.5 rounded-xl border border-dark-4/50">
                    {visita.descripcion}
                  </p>

                  {/* Photos Preview Strip */}
                  {fotosCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 overflow-hidden">
                      {visita.fotografias.slice(0, 3).map((f, i) => (
                        <div key={i} className="w-12 h-12 rounded-lg bg-dark-3 border border-dark-4 overflow-hidden flex-shrink-0">
                          <img
                            src={f.thumbnailUrl || f.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {fotosCount > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-dark-3 border border-dark-4 flex items-center justify-center text-[10px] font-black text-gold flex-shrink-0">
                          +{fotosCount - 3}
                        </div>
                      )}
                      <div className="text-[10px] text-cream-muted/70 flex items-center gap-1 ml-1">
                        <Camera className="w-3 h-3 text-gold" />
                        {fotosCount} foto{fotosCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  {/* Badges footer */}
                  <div className="flex items-center gap-3 text-[10px] text-cream-muted mt-3 pt-3 border-t border-dark-4/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cream-muted" />
                      {visita.fecha_visita?.split('T')[0] || visita.fecha_expedicion}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-gold" />
                      {visita.elaboro_nombre}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-dark-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewVisita(visita)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gold/10 hover:bg-gold text-gold hover:text-dark-1 border border-gold/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Abrir visor de vista previa interactivo"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Vista Previa
                  </button>

                  <button
                    onClick={() => handleGeneratePdf(visita)}
                    disabled={generatingPdfId === visita.id}
                    className="py-2 px-3 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    title="Descargar PDF directo"
                  >
                    {generatingPdfId === visita.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Generando...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(visita)}
                    className="p-2 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 transition-all cursor-pointer"
                    title="Editar visita técnica"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(visita)}
                    className="p-2 rounded-xl bg-dark-3 hover:bg-red-500/20 text-cream-muted hover:text-red-400 border border-dark-4 hover:border-red-500/30 transition-all cursor-pointer"
                    title="Eliminar reporte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <VisitaTecnicaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingVisita={editingVisita}
        onSave={handleSave}
        existingVisitas={visitas}
        currentUserName={currentUser?.name}
      />

      {/* Modal de Vista Previa Oficial */}
      {previewVisita && (
        <VisitaTecnicaPreviewModal
          isOpen={!!previewVisita}
          onClose={() => setPreviewVisita(null)}
          visita={previewVisita}
        />
      )}
    </div>
  );
};
export default VisitasTecnicasTab;
