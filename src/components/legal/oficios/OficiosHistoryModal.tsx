import React, { useState } from 'react';
import { X, Search, FileText, Trash2, Calendar, Download, FileEdit, CheckCircle2 } from 'lucide-react';
import type { OficioData } from './types';
import { generateOficioPdf } from './oficioPdfGenerator';

interface OficiosHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  oficiosList: OficioData[];
  onSelectOficio: (oficio: OficioData) => void;
  onDeleteOficio: (id: string) => void;
  onToggleStatus?: (oficio: OficioData, newStatus: 'borrador' | 'emitido') => void;
}

export default function OficiosHistoryModal({
  isOpen,
  onClose,
  oficiosList,
  onSelectOficio,
  onDeleteOficio,
  onToggleStatus
}: OficiosHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrador' | 'emitido'>('all');
  const [isExportingId, setIsExportingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = oficiosList.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (o.folio || '').toLowerCase().includes(term) ||
      (o.asunto || '').toLowerCase().includes(term) ||
      (o.nombreObra || '').toLowerCase().includes(term) ||
      (o.clienteFinal || '').toLowerCase().includes(term) ||
      (o.destinatarioNombre || '').toLowerCase().includes(term) ||
      (o.destinatarioEmpresa || '').toLowerCase().includes(term)
    );

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'borrador' && o.estado === 'borrador') ||
      (statusFilter === 'emitido' && (o.estado === 'emitido' || !o.estado));

    return matchesSearch && matchesStatus;
  });

  const countBorradores = oficiosList.filter(o => o.estado === 'borrador').length;
  const countEmitidos = oficiosList.filter(o => o.estado === 'emitido' || !o.estado).length;

  const handleQuickDownload = async (e: React.MouseEvent, oficio: OficioData) => {
    e.stopPropagation();
    try {
      setIsExportingId(oficio.id || oficio.folio);
      await generateOficioPdf(oficio);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setIsExportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-4 flex items-center justify-between bg-dark-1/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-cream flex items-center gap-2">
                Historial de Oficios y Borradores
                <span className="text-xs bg-dark-3 text-gold px-2 py-0.5 rounded-full border border-dark-4">
                  {oficiosList.length} en total
                </span>
              </h3>
              <p className="text-xs text-cream-muted">
                Consulta, retoma borradores o descarga documentos emitidos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cream-muted hover:text-cream p-2 rounded-lg hover:bg-dark-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-dark-4 bg-dark-2 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-cream-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por folio, asunto, obra, cliente o destinatario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-1 border border-dark-4 rounded-xl pl-9 pr-4 py-2.5 text-sm text-cream placeholder:text-cream-muted/50 focus:border-gold outline-none transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gold text-dark-1 font-bold'
                  : 'bg-dark-3 text-cream-muted hover:text-cream border border-dark-4'
              }`}
            >
              Todos ({oficiosList.length})
            </button>

            <button
              onClick={() => setStatusFilter('emitido')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === 'emitido'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-dark-3 text-cream-muted hover:text-emerald-400 border border-dark-4'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Emitidos ({countEmitidos})</span>
            </button>

            <button
              onClick={() => setStatusFilter('borrador')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === 'borrador'
                  ? 'bg-amber-500 text-dark-1 font-bold'
                  : 'bg-dark-3 text-cream-muted hover:text-amber-400 border border-dark-4'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Borradores ({countBorradores})</span>
            </button>
          </div>
        </div>

        {/* List of Oficios */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-cream-muted">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-gold" />
              <p className="text-sm font-medium">No se encontraron oficios o borradores</p>
              <p className="text-xs opacity-70 mt-1">Crea tu primer oficio o borrador en el formulario principal.</p>
            </div>
          ) : (
            filtered.map((oficio) => {
              const isDraft = oficio.estado === 'borrador';

              return (
                <div
                  key={oficio.id || oficio.folio}
                  onClick={() => {
                    onSelectOficio(oficio);
                    onClose();
                  }}
                  className={`border rounded-xl p-4 transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDraft
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-dark-3/50 hover:bg-dark-3 border-dark-4 hover:border-gold/50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                        {oficio.folio}
                      </span>

                      {/* Status Badge */}
                      {isDraft ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                          Borrador
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                          Emitido
                        </span>
                      )}

                      <span className="text-xs text-cream-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gold/70" />
                        {oficio.fecha}
                      </span>
                      {oficio.nombreObra && (
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 truncate max-w-[200px]">
                          {oficio.nombreObra}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-cream group-hover:text-gold transition-colors line-clamp-1">
                      {oficio.asunto || 'Sin asunto definido'}
                    </h4>

                    <div className="text-xs text-cream-muted flex items-center gap-2 flex-wrap">
                      <span>
                        <strong className="text-cream/80">Destinatario:</strong> {oficio.destinatarioTitulo} {oficio.destinatarioNombre || '(Pendiente)'} {oficio.destinatarioEmpresa ? `(${oficio.destinatarioEmpresa})` : ''}
                      </span>
                      {oficio.clienteFinal && (
                        <span>• <strong className="text-cream/80">Cliente:</strong> {oficio.clienteFinal}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {onToggleStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(oficio, isDraft ? 'emitido' : 'borrador');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 shadow-sm ${
                          isDraft
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                            : 'bg-dark-1 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                        title={isDraft ? 'Promover inmediatamente a Emitido Oficial' : 'Cambiar a Borrador'}
                      >
                        {isDraft ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Emitir</span>
                          </>
                        ) : (
                          <>
                            <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                            <span>A Borrador</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectOficio(oficio);
                        onClose();
                      }}
                      className={`px-3 py-1.5 border rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium ${
                        isDraft
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                          : 'bg-dark-1 hover:bg-gold/20 text-cream-muted hover:text-gold border-dark-4 hover:border-gold/40'
                      }`}
                      title={isDraft ? 'Continuar redactando borrador' : 'Cargar en editor para modificar'}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>{isDraft ? 'Continuar' : 'Editar'}</span>
                    </button>

                    <button
                      onClick={(e) => handleQuickDownload(e, oficio)}
                      disabled={isExportingId === (oficio.id || oficio.folio)}
                      className="p-2 bg-dark-1 hover:bg-gold/20 text-cream-muted hover:text-gold border border-dark-4 hover:border-gold/40 rounded-lg transition-colors text-xs flex items-center gap-1.5"
                      title="Descargar PDF directo"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden md:inline">PDF</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de eliminar el ${isDraft ? 'borrador' : 'oficio'} ${oficio.folio}?`)) {
                          onDeleteOficio(oficio.id || oficio.folio);
                        }
                      }}
                      className="p-2 bg-dark-1 hover:bg-red-500/20 text-cream-muted hover:text-red-400 border border-dark-4 hover:border-red-500/30 rounded-lg transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-4 bg-dark-1/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-cream-muted hover:text-cream bg-dark-3 hover:bg-dark-4 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
