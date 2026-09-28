import React, { useState, useEffect, useCallback } from 'react';
import type { OficioData } from './types';
import { OFICIOS_TEMPLATES } from './templates';
import OficioForm from './OficioForm';
import OficioPreviewModal from './OficioPreviewModal';
import OficiosHistoryModal from './OficiosHistoryModal';
import { generateOficioPdf } from './oficioPdfGenerator';
import { supabase } from '../../../context/supabase';
import { CheckCircle2 } from 'lucide-react';

interface OficiosTabProps {
  initialBudgetId?: string | null;
}

const STORAGE_KEY = 'esol_oficios_guardados_local';

export const getNextFolio = (existingOficios: OficioData[] = []): string => {
  const currentYear = new Date().getFullYear();
  const yearPattern = new RegExp(`OF-ESOL-${currentYear}-(\\d+)`, 'i');
  
  let maxNum = 0;

  // 1. Scan memory list
  if (Array.isArray(existingOficios)) {
    existingOficios.forEach(o => {
      if (o.folio) {
        const match = o.folio.match(yearPattern);
        if (match && match[1]) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) {
            maxNum = n;
          }
        }
      }
    });
  }

  // 2. Scan localStorage as additional safety check
  try {
    const localStr = localStorage.getItem(STORAGE_KEY);
    if (localStr) {
      const localList: OficioData[] = JSON.parse(localStr);
      if (Array.isArray(localList)) {
        localList.forEach(o => {
          if (o.folio) {
            const match = o.folio.match(yearPattern);
            if (match && match[1]) {
              const n = parseInt(match[1], 10);
              if (!isNaN(n) && n > maxNum) {
                maxNum = n;
              }
            }
          }
        });
      }
    }
  } catch (e) {}

  const nextNum = maxNum + 1;
  return `OF-ESOL-${currentYear}-${String(nextNum).padStart(3, '0')}`;
};

export const getDefaultOficio = (
  initialBudgetId?: string | null, 
  existingOficios: OficioData[] = [],
  user?: { name?: string; email?: string; role?: string }
): OficioData => {
  const defaultTmpl = OFICIOS_TEMPLATES[0];
  const userName = user?.name?.trim() || 'Manuel de Jesus Fregoso Samaniega';
  let userCargo = 'REPRESENTANTE LEGAL';
  if (user?.role === 'master') {
    userCargo = 'DIRECCIÓN GENERAL / REPRESENTANTE LEGAL';
  } else if (user?.role === 'admin') {
    userCargo = 'ADMINISTRACIÓN Y CONTROL DE OPERACIONES';
  } else if (user?.role) {
    userCargo = 'SUPERVISOR DE OBRA Y PROYECTOS';
  }

  const userEmail = user?.email || '';
  let storedSig: string | null = null;
  try {
    if (userEmail) {
      storedSig = localStorage.getItem(`esol_firma_digital_${userEmail}`);
    }
    if (!storedSig) {
      storedSig = localStorage.getItem('esol_firma_digital_precargada');
    }
  } catch (e) {}

  return {
    folio: getNextFolio(existingOficios),
    fecha: new Date().toISOString().split('T')[0],
    lugar: 'Tepic, Nayarit',
    presupuestoId: initialBudgetId || '',
    nombreObra: '',
    ubicacionObra: '',
    clienteFinal: '',
    tipoOficio: defaultTmpl.id,
    destinatarioTitulo: 'Ing.',
    destinatarioNombre: '',
    destinatarioCargo: 'Superintendente de Obra',
    destinatarioEmpresa: '',
    destinatarioAtencion: '',
    asunto: defaultTmpl.asuntoDefault,
    referencia: '',
    vocativo: defaultTmpl.vocativoDefault,
    antecedentes: defaultTmpl.antecedentesDefault,
    cuerpo: defaultTmpl.cuerpoDefault,
    fundamentacion: defaultTmpl.fundamentacionDefault,
    peticion: defaultTmpl.peticionDefault,
    despedida: defaultTmpl.despedidaDefault,
    remitenteNombre: userName,
    remitenteCargo: userCargo,
    remitenteCedula: '',
    empresaRazonSocial: 'ESOL ENERGIAS',
    empresaRFC: '',
    empresaDomicilio: 'Tepic, Nayarit, México',
    empresaTelefono: '3112343034',
    empresaEmail: userEmail || 'contacto@esolenergias.com',
    ccp: [...defaultTmpl.ccpDefault],
    anexos: [...defaultTmpl.anexosDefault],
    firmaDigital: storedSig || undefined,
    incluirFirmaDigital: Boolean(storedSig),
    estado: 'borrador'
  };
};

export default function OficiosTab({ initialBudgetId }: OficiosTabProps) {
  const [oficio, setOficio] = useState<OficioData>(() => getDefaultOficio(initialBudgetId));
  const [oficiosList, setOficiosList] = useState<OficioData[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load saved oficios from Supabase AND localStorage, merging them seamlessly
  const loadOficios = useCallback(async () => {
    let combinedList: OficioData[] = [];

    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('oficios_obra')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: OficioData[] = data.map((d: any) => ({
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
          cuerpo: d.cuerpo || '',
          fundamentacion: d.fundamentacion || '',
          peticion: d.peticion || '',
          despedida: d.despedida || '',
          remitenteNombre: d.remitente_nombre || 'Manuel de Jesus Fregoso Samaniega',
          remitenteCargo: d.remitente_cargo || 'REPRESENTANTE LEGAL',
          remitenteCedula: d.remitente_cedula || '',
          empresaRazonSocial: d.empresa_razon_social || 'ESOL ENERGIAS',
          empresaRFC: d.empresa_rfc || '',
          empresaDomicilio: d.empresa_domicilio || 'Tepic, Nayarit, México',
          empresaTelefono: d.empresa_telefono || '3112343034',
          empresaEmail: d.empresa_email || '',
          ccp: Array.isArray(d.ccp) ? d.ccp : [],
          anexos: Array.isArray(d.anexos) ? d.anexos : [],
          estado: d.estado || 'emitido',
          drive_url: d.drive_url,
          firmaDigital: d.firma_digital || undefined,
          incluirFirmaDigital: d.incluir_firma_digital ?? true,
          created_at: d.created_at,
          updated_at: d.updated_at
        }));
        combinedList = mapped;
      }
    } catch (err) {
      console.warn('Supabase not available, using local cache');
    }

    // 2. Merge with LocalStorage fallback
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed: OficioData[] = JSON.parse(local);
        if (Array.isArray(parsed)) {
          parsed.forEach(localItem => {
            const exists = combinedList.some(o => o.id === localItem.id || o.folio === localItem.folio);
            if (!exists) {
              combinedList.push(localItem);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error parsing local oficios:', e);
    }

    setOficiosList(combinedList);

    // If there is an oficio targeted for editing from CRM
    const editingTarget = localStorage.getItem('esol_oficio_editing_target');
    if (editingTarget) {
      try {
        const parsedTarget: OficioData = JSON.parse(editingTarget);
        setOficio(parsedTarget);
        localStorage.removeItem('esol_oficio_editing_target');
        setNotification({
          type: 'success',
          message: `Oficio ${parsedTarget.folio} cargado para edición.`
        });
        setTimeout(() => setNotification(null), 4000);
        return;
      } catch (err) {
        console.error('Error parsing editing target:', err);
      }
    }

    // If starting fresh and no ID yet, calculate next consecutive folio
    setOficio(prev => {
      if (prev.id) return prev; // If editing an existing one, do not overwrite
      return {
        ...prev,
        folio: getNextFolio(combinedList)
      };
    });
  }, []);

  useEffect(() => {
    loadOficios();
  }, [loadOficios]);

  // Core persistence function
  const saveOficioDirectly = async (dataToSave: OficioData): Promise<OficioData> => {
    const today = new Date().toISOString().split('T')[0];
    const updatedRecord: OficioData = {
      ...dataToSave,
      id: dataToSave.id || crypto.randomUUID(),
      fecha: dataToSave.fecha || today,
      updated_at: new Date().toISOString()
    };

    // 1. Primary Save to Supabase Cloud Database
    try {
      const dbPayload = {
        id: updatedRecord.id,
        folio: updatedRecord.folio,
        fecha: updatedRecord.fecha,
        lugar: updatedRecord.lugar,
        presupuesto_id: updatedRecord.presupuestoId || null,
        nombre_obra: updatedRecord.nombreObra,
        ubicacion_obra: updatedRecord.ubicacionObra,
        cliente_final: updatedRecord.clienteFinal,
        tipo_oficio: updatedRecord.tipoOficio,
        destinatario_titulo: updatedRecord.destinatarioTitulo,
        destinatario_nombre: updatedRecord.destinatarioNombre,
        destinatario_cargo: updatedRecord.destinatarioCargo,
        destinatario_empresa: updatedRecord.destinatarioEmpresa,
        destinatario_atencion: updatedRecord.destinatarioAtencion,
        asunto: updatedRecord.asunto,
        referencia: updatedRecord.referencia,
        vocativo: updatedRecord.vocativo,
        antecedentes: updatedRecord.antecedentes,
        cuerpo: updatedRecord.cuerpo,
        fundamentacion: updatedRecord.fundamentacion,
        peticion: updatedRecord.peticion,
        despedida: updatedRecord.despedida,
        remitente_nombre: updatedRecord.remitenteNombre,
        remitente_cargo: updatedRecord.remitenteCargo,
        remitente_cedula: updatedRecord.remitenteCedula,
        empresa_razon_social: updatedRecord.empresaRazonSocial,
        empresa_rfc: updatedRecord.empresaRFC,
        empresa_domicilio: updatedRecord.empresaDomicilio,
        empresa_telefono: updatedRecord.empresaTelefono,
        empresa_email: updatedRecord.empresaEmail,
        ccp: updatedRecord.ccp,
        anexos: updatedRecord.anexos,
        estado: updatedRecord.estado || 'emitido',
        drive_url: updatedRecord.drive_url || null,
        firma_digital: updatedRecord.firmaDigital || null,
        incluir_firma_digital: updatedRecord.incluirFirmaDigital ?? true,
        updated_at: updatedRecord.updated_at
      };

      const { error } = await supabase.from('oficios_obra').upsert(dbPayload);
      if (error) {
        console.warn('Advertencia Supabase:', error);
      }
    } catch (dbErr) {
      console.warn('Error saving to Supabase:', dbErr);
    }

    // 2. ALWAYS Save to localStorage
    try {
      const localStr = localStorage.getItem(STORAGE_KEY);
      let localList: OficioData[] = localStr ? JSON.parse(localStr) : [];
      if (!Array.isArray(localList)) localList = [];

      const existingIdx = localList.findIndex(item => item.id === updatedRecord.id || item.folio === updatedRecord.folio);
      if (existingIdx >= 0) {
        localList[existingIdx] = updatedRecord;
      } else {
        localList = [updatedRecord, ...localList];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localList));

      // Update state
      setOficiosList(localList);
    } catch (lsErr) {
      console.error('Error saving to localStorage:', lsErr);
    }

    setOficio(updatedRecord);
    return updatedRecord;
  };

  const handleSaveOficio = async (targetEstado: 'borrador' | 'emitido' = 'emitido') => {
    if (targetEstado === 'emitido' && (!oficio.folio || !oficio.destinatarioNombre || !oficio.cuerpo)) {
      alert('Para emitir formalmente, completa al menos el Folio, Nombre del Destinatario y el Cuerpo del Oficio.');
      return;
    }
    if (targetEstado === 'borrador' && !oficio.folio && !oficio.asunto && !oficio.clienteFinal) {
      alert('Por favor ingresa al menos un Folio, Asunto o Cliente para guardar el borrador.');
      return;
    }

    try {
      setIsSaving(true);
      const withStatus: OficioData = {
        ...oficio,
        estado: targetEstado
      };
      const saved = await saveOficioDirectly(withStatus);

      setNotification({
        type: 'success',
        message: targetEstado === 'borrador'
          ? `Borrador ${saved.folio} guardado para continuar después.`
          : `Oficio ${saved.folio} guardado y emitido formalmente.`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar oficio:', err);
      setNotification({
        type: 'error',
        message: 'Error al guardar el oficio: ' + (err.message || 'Error desconocido')
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOficio = async (idOrFolio: string) => {
    try {
      try {
        await supabase
          .from('oficios_obra')
          .delete()
          .or(`id.eq.${idOrFolio},folio.eq.${idOrFolio}`);
      } catch (e) {
        // ignore
      }

      setOficiosList(prev => {
        const updated = prev.filter(o => o.id !== idOrFolio && o.folio !== idOrFolio);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      setNotification({
        type: 'success',
        message: 'Oficio eliminado del historial.'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error al eliminar oficio:', err);
    }
  };

  const handleSelectHistoricalOficio = (selected: OficioData) => {
    setOficio({ ...selected });
    setNotification({
      type: 'success',
      message: `Oficio ${selected.folio} cargado para edición.`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNewOficio = () => {
    const nextFolio = getNextFolio(oficiosList);
    const newOficioData = {
      ...getDefaultOficio(initialBudgetId, oficiosList),
      folio: nextFolio
    };
    setOficio(newOficioData);
    setNotification({
      type: 'success',
      message: `Nuevo lienzo de oficio listo (${nextFolio}).`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleStatus = async (targetOficio: OficioData, newStatus: 'borrador' | 'emitido') => {
    try {
      const updated: OficioData = {
        ...targetOficio,
        estado: newStatus,
        updated_at: new Date().toISOString()
      };
      await saveOficioDirectly(updated);
      setNotification({
        type: 'success',
        message: newStatus === 'emitido'
          ? `Oficio ${targetOficio.folio} promovido a EMITIDO con éxito.`
          : `Oficio ${targetOficio.folio} cambiado a BORRADOR.`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Error al cambiar estatus:', err);
      setNotification({
        type: 'error',
        message: 'Error al cambiar el estatus del oficio: ' + (err.message || 'Error desconocido')
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!oficio.destinatarioNombre || !oficio.cuerpo) {
      alert('Por favor completa al menos el destinatario y el cuerpo del oficio antes de generar el PDF.');
      return;
    }
    try {
      setNotification({
        type: 'success',
        message: 'Guardando oficio y generando PDF...'
      });

      // 1. Auto-save oficio with latest modification timestamp
      const savedOficio = await saveOficioDirectly(oficio);

      // 2. Generate PDF and open blob URL
      const result = await generateOficioPdf(savedOficio);

      if (result.driveUrl) {
        const withDrive = { ...savedOficio, drive_url: result.driveUrl };
        await saveOficioDirectly(withDrive);
      }

      setNotification({
        type: 'success',
        message: `Oficio ${savedOficio.folio} generado y guardado exitosamente.`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      setNotification({
        type: 'error',
        message: 'Error al generar el archivo PDF: ' + (error?.message || 'Error desconocido')
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Notifications Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between shadow-lg transition-all animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Oficio Form */}
      <OficioForm
        initialBudgetId={initialBudgetId}
        oficio={oficio}
        setOficio={setOficio}
        onPreview={() => setIsPreviewOpen(true)}
        onDownload={handleDownloadPdf}
        onSave={() => handleSaveOficio('emitido')}
        onSaveDraft={() => handleSaveOficio('borrador')}
        onOpenHistory={() => {
          loadOficios();
          setIsHistoryOpen(true);
        }}
        onNewOficio={handleNewOficio}
        isSaving={isSaving}
      />

      {/* Modal de Vista Previa */}
      {isPreviewOpen && (
        <OficioPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          oficio={oficio}
        />
      )}

      {/* Modal de Historial de Oficios */}
      {isHistoryOpen && (
        <OficiosHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          oficiosList={oficiosList}
          onSelectOficio={handleSelectHistoricalOficio}
          onDeleteOficio={handleDeleteOficio}
          onToggleStatus={handleToggleStatus}
        />
      )}

    </div>
  );
}
