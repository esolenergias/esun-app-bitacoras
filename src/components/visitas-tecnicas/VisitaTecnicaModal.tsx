import React, { useState, useEffect } from 'react';
import { 
  X, Save, FileText, Camera, Plus, Trash2, MapPin, 
  CheckCircle, Building, User, Phone, Zap, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import type { VisitaTecnica, TipoVisita, EstadoVisita, PuntoClave, FotoEvidencia, ParametrosTecnicos } from './types';
import { visitasService } from './visitasService';
import { SignaturePad } from './SignaturePad';
import { compressImageClientSide, getDriveDirectImageUrl } from '../esun/lib/driveUploader';
import { supabase } from '../../context/supabase';

interface VisitaTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVisita?: VisitaTecnica | null;
  onSave: (visita: VisitaTecnica, generatePdf?: boolean) => Promise<void>;
  existingVisitas: VisitaTecnica[];
  currentUserName?: string;
}

const TIPOS_VISITA: TipoVisita[] = [
  'Levantamiento Fotovoltaico',
  'Inspección Técnica Preliminar',
  'Supervisión de Avance',
  'Entrega y Recepción de Obra',
  'Diagnóstico y Detección de Fallas',
  'Factibilidad de Interconexión CFE',
  'Mantenimiento Preventivo / Correctivo',
  'Otro'
];

export const VisitaTecnicaModal: React.FC<VisitaTecnicaModalProps> = ({
  isOpen,
  onClose,
  editingVisita,
  onSave,
  existingVisitas,
  currentUserName
}) => {
  if (!isOpen) return null;

  // Active sub-tab inside the form modal
  const [activeTab, setActiveTab] = useState<'general' | 'tecnico' | 'fotos' | 'firmas'>('general');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Ecosystem data
  const [obrasList, setObrasList] = useState<any[]>([]);
  const [presupuestosList, setPresupuestosList] = useState<any[]>([]);
  const [clientesList, setClientesList] = useState<any[]>([]);

  // Form Fields
  const [folio, setFolio] = useState('');
  const [fechaVisita, setFechaVisita] = useState('');
  const [fechaExpedicion, setFechaExpedicion] = useState('');
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>('Levantamiento Fotovoltaico');
  const [estado, setEstado] = useState<EstadoVisita>('completada');

  // Asociación
  const [esObraExistente, setEsObraExistente] = useState(true);
  const [obraNombre, setObraNombre] = useState('');
  const [presupuestoId, setPresupuestoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [sitioNombre, setSitioNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [latitud, setLatitud] = useState<number | undefined>();
  const [longitud, setLongitud] = useState<number | undefined>();
  const [registrarClienteEnCrm, setRegistrarClienteEnCrm] = useState(false);

  // Personal
  const [elaboroNombre, setElaboroNombre] = useState('');
  const [elaboroCargo, setElaboroCargo] = useState('Ingeniero de Proyectos');
  const [elaboroTelefono, setElaboroTelefono] = useState('');
  const [recibeNombre, setRecibeNombre] = useState('');
  const [recibeCargo, setRecibeCargo] = useState('Cliente / Propietario');
  const [recibeTelefono, setRecibeTelefono] = useState('');

  // Contenido
  const [descripcion, setDescripcion] = useState('');
  const [puntosClave, setPuntosClave] = useState<PuntoClave[]>([]);
  const [nuevoPuntoTitulo, setNuevoPuntoTitulo] = useState('');
  const [nuevoPuntoDesc, setNuevoPuntoDesc] = useState('');
  
  // Parámetros técnicos
  const [parametros, setParametros] = useState<ParametrosTecnicos>({
    tipo_red: '',
    voltaje_medido: '',
    capacidad_interruptor: '',
    tipo_techumbre: '',
    inclinacion_grados: '',
    orientacion: 'Sur 180°',
    area_disponible_m2: '',
    condicion_techumbre: 'Buena',
    nivel_sombras: 'Nulo (Sin sombras)',
    tarifa_cfe: ''
  });

  const [recomendaciones, setRecomendaciones] = useState('');
  const [siguientesPasos, setSiguientesPasos] = useState('');

  // Fotos y Firmas
  const [fotografias, setFotografias] = useState<FotoEvidencia[]>([]);
  const [firmaElaboro, setFirmaElaboro] = useState<string | null>(null);
  const [firmaRecibe, setFirmaRecibe] = useState<string | null>(null);

  // Load ecosystem data on mount
  useEffect(() => {
    visitasService.fetchEcosystemData().then(({ obras, presupuestos, clientes }) => {
      setObrasList(obras);
      setPresupuestosList(presupuestos);
      setClientesList(clientes);
    });
  }, []);

  // Initialize form state
  useEffect(() => {
    if (editingVisita) {
      setFolio(editingVisita.folio);
      setFechaVisita(editingVisita.fecha_visita || '');
      setFechaExpedicion(editingVisita.fecha_expedicion || new Date().toISOString().split('T')[0]);
      setTipoVisita(editingVisita.tipo_visita || 'Levantamiento Fotovoltaico');
      setEstado(editingVisita.estado || 'completada');
      setEsObraExistente(editingVisita.es_obra_existente ?? true);
      setObraNombre(editingVisita.obra_nombre || '');
      setPresupuestoId(editingVisita.presupuesto_id || '');
      setClienteId(editingVisita.cliente_id || '');
      setClienteNombre(editingVisita.cliente_nombre || '');
      setSitioNombre(editingVisita.sitio_nombre || '');
      setUbicacion(editingVisita.ubicacion || '');
      setLatitud(editingVisita.coordenadas_gps?.latitud);
      setLongitud(editingVisita.coordenadas_gps?.longitud);
      setElaboroNombre(editingVisita.elaboro_nombre || currentUserName || 'Ing. de Proyectos ESOL');
      setElaboroCargo(editingVisita.elaboro_cargo || 'Ingeniero de Proyectos');
      setElaboroTelefono(editingVisita.elaboro_telefono || '');
      setRecibeNombre(editingVisita.recibe_nombre || '');
      setRecibeCargo(editingVisita.recibe_cargo || 'Cliente / Propietario');
      setRecibeTelefono(editingVisita.recibe_telefono || '');
      setDescripcion(editingVisita.descripcion || '');
      setPuntosClave(editingVisita.puntos_clave || []);
      setParametros(editingVisita.parametros_tecnicos || {});
      setRecomendaciones(editingVisita.recomendaciones || '');
      setSiguientesPasos(editingVisita.siguientes_pasos || '');
      setFotografias(editingVisita.fotografias || []);
      setFirmaElaboro(editingVisita.firma_elaboro || null);
      setFirmaRecibe(editingVisita.firma_recibe || null);
    } else {
      // Default new record
      setFolio(visitasService.generateFolio(existingVisitas));
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFechaVisita(localIso);
      setFechaExpedicion(now.toISOString().split('T')[0]);
      setTipoVisita('Levantamiento Fotovoltaico');
      setEstado('completada');
      setEsObraExistente(true);
      setObraNombre('');
      setPresupuestoId('');
      setClienteId('');
      setClienteNombre('');
      setSitioNombre('');
      setUbicacion('');
      setLatitud(undefined);
      setLongitud(undefined);
      setElaboroNombre(currentUserName || 'Ing. Manuel Fregoso');
      setElaboroCargo('Ingeniero de Proyectos / Residente');
      setElaboroTelefono('');
      setRecibeNombre('');
      setRecibeCargo('Cliente / Propietario');
      setRecibeTelefono('');
      setDescripcion('');
      setPuntosClave([]);
      setParametros({
        tipo_red: '',
        voltaje_medido: '',
        capacidad_interruptor: '',
        tipo_techumbre: '',
        inclinacion_grados: '',
        orientacion: 'Sur 180°',
        area_disponible_m2: '',
        condicion_techumbre: 'Buena',
        nivel_sombras: 'Nulo (Sin sombras)',
        tarifa_cfe: ''
      });
      setRecomendaciones('');
      setSiguientesPasos('');
      setFotografias([]);
      setFirmaElaboro(null);
      setFirmaRecibe(null);
    }
  }, [editingVisita, existingVisitas, currentUserName]);

  // Handler when selecting an Obra from dropdown
  const handleSelectObra = (selectedName: string) => {
    setObraNombre(selectedName);
    const obra = obrasList.find(o => o.nombre === selectedName);
    if (obra) {
      if (!sitioNombre || sitioNombre === obraNombre) setSitioNombre(obra.nombre);
      if (obra.cliente) setClienteNombre(obra.cliente);
      if (obra.ubicacion) setUbicacion(obra.ubicacion);
      if (obra.residente) setElaboroNombre(obra.residente);
    }
  };

  // Handler when selecting a Presupuesto from dropdown
  const handleSelectPresupuesto = (pId: string) => {
    setPresupuestoId(pId);
    const pres = presupuestosList.find(p => p.id === pId);
    if (pres) {
      if (!sitioNombre) setSitioNombre(pres.name);
      if (pres.client_name) setClienteNombre(pres.client_name);
      if (pres.ubicacion) setUbicacion(pres.ubicacion);
    }
  };

  // Capture GPS coordinates
  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('No se pudo obtener la ubicación GPS actual. Verifique los permisos.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Add a Punto Clave
  const handleAddPuntoClave = () => {
    if (!nuevoPuntoTitulo.trim()) return;
    const newPt: PuntoClave = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      titulo: nuevoPuntoTitulo.trim(),
      descripcion: nuevoPuntoDesc.trim() || undefined
    };
    setPuntosClave([...puntosClave, newPt]);
    setNuevoPuntoTitulo('');
    setNuevoPuntoDesc('');
  };

  const handleRemovePuntoClave = (id: string) => {
    setPuntosClave(puntosClave.filter(p => p.id !== id));
  };

  // Image Upload handler
  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const totalFiles = files.length;
    const addedPhotos: FotoEvidencia[] = [];

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      setUploadProgressText(`Procesando foto ${i + 1} de ${totalFiles}...`);

      try {
        // Compress client-side
        const { base64, dataUrl } = await compressImageClientSide(file, 1920, 0.85);

        // Upload to Google Apps Script webhook
        let driveUrl = '';
        let thumbnailUrl = '';

        try {
          const siteClean = (sitioNombre || clienteNombre || 'Sitio').trim().replace(/[/\\?%*:|"<>]/g, '-');
          const response = await fetch('https://script.google.com/macros/s/AKfycbx2I7-77T-EUv-3DCK7ueL9eGn4871nv-EJY_qBJxRu5TFQ3IWNcXOjEE89ghI4UbLa2w/exec', {
            method: 'POST',
            body: JSON.stringify({
              filename: `visita_${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
              mimeType: 'image/jpeg',
              base64,
              moduleType: 'VISITA_TECNICA',
              siteName: siteClean,
              folderName: `Visitas Técnicas - ${siteClean}`
            })
          });

          const res = await response.json();
          if (res && res.success && res.url) {
            driveUrl = res.url;
            thumbnailUrl = getDriveDirectImageUrl(driveUrl);
          }
        } catch (webhookErr) {
          console.warn('Apps Script upload failed, using client data URL as fallback:', webhookErr);
        }

        const finalUrl = driveUrl || dataUrl;
        addedPhotos.push({
          id: `foto_${Date.now()}_${i}`,
          url: finalUrl,
          thumbnailUrl: thumbnailUrl || finalUrl,
          descripcion: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          fecha: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error compressing/uploading photo:', err);
      }
    }

    setFotografias(prev => [...prev, ...addedPhotos]);
    setIsUploadingPhoto(false);
    setUploadProgressText('');
    e.target.value = ''; // Reset input
  };

  const handleRemovePhoto = (id: string) => {
    setFotografias(fotografias.filter(f => f.id !== id));
  };

  const handleUpdatePhotoDesc = (id: string, desc: string) => {
    setFotografias(fotografias.map(f => f.id === id ? { ...f, descripcion: desc } : f));
  };

  // Submit
  const handleSubmit = async (generatePdf = false) => {
    if (!sitioNombre.trim()) {
      alert('Por favor ingrese el nombre del sitio o predio de la visita.');
      setActiveTab('general');
      return;
    }
    if (!clienteNombre.trim()) {
      alert('Por favor ingrese el nombre del cliente.');
      setActiveTab('general');
      return;
    }
    if (!elaboroNombre.trim()) {
      alert('Por favor indique el nombre de quien elaboró la visita.');
      setActiveTab('general');
      return;
    }
    if (!descripcion.trim()) {
      alert('Por favor ingrese una descripción del reporte o actividades.');
      setActiveTab('general');
      return;
    }

    setIsSubmitting(true);

    try {
      // Optional: register independent client into CRM
      if (!esObraExistente && registrarClienteEnCrm && clienteNombre.trim()) {
        try {
          await supabase.from('clientes').insert([{
            nombre_razon_social: clienteNombre.trim(),
            telefono: recibeTelefono || null,
            representante_legal: recibeNombre || null
          }]);
        } catch (crmErr) {
          console.warn('Could not auto-register client in CRM:', crmErr);
        }
      }

      const visitaRecord: VisitaTecnica = {
        id: editingVisita?.id || `local_${Date.now()}`,
        folio: folio || visitasService.generateFolio(existingVisitas),
        fecha_visita: fechaVisita || new Date().toISOString(),
        fecha_expedicion: fechaExpedicion || new Date().toISOString().split('T')[0],
        tipo_visita: tipoVisita,
        estado: estado,
        es_obra_existente: esObraExistente,
        obra_nombre: esObraExistente ? obraNombre : undefined,
        presupuesto_id: presupuestoId || null,
        cliente_id: clienteId || null,
        cliente_nombre: clienteNombre.trim(),
        sitio_nombre: sitioNombre.trim(),
        ubicacion: ubicacion.trim(),
        coordenadas_gps: (latitud || longitud) ? { latitud, longitud } : null,
        elaboro_nombre: elaboroNombre.trim(),
        elaboro_cargo: elaboroCargo.trim(),
        elaboro_telefono: elaboroTelefono.trim() || undefined,
        recibe_nombre: recibeNombre.trim(),
        recibe_cargo: recibeCargo.trim(),
        recibe_telefono: recibeTelefono.trim() || undefined,
        descripcion: descripcion.trim(),
        puntos_clave: puntosClave,
        parametros_tecnicos: parametros,
        recomendaciones: recomendaciones.trim() || undefined,
        siguientes_pasos: siguientesPasos.trim() || undefined,
        fotografias: fotografias,
        firma_elaboro: firmaElaboro,
        firma_recibe: firmaRecibe
      };

      await onSave(visitaRecord, generatePdf);
      onClose();
    } catch (err: any) {
      console.error('Error submitting visita:', err);
      alert('Error al guardar la visita: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-dark-2 border border-dark-4 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-4 bg-dark-1/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-cream flex items-center gap-2">
                {editingVisita ? `Editar Visita Técnica: ${editingVisita.folio}` : 'Nueva Visita Técnica'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-bold uppercase tracking-wider">
                  {folio}
                </span>
              </h2>
              <p className="text-xs text-cream-muted">
                Registro de inspección, levantamiento en campo y evidencia fotográfica oficial ESOL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex border-b border-dark-4 bg-dark-3/40 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'general', label: '1. Datos y Asociación' },
            { id: 'tecnico', label: '2. Contenido y Parámetros' },
            { id: 'fotos', label: `3. Evidencia Fotográfica (${fotografias.length})` },
            { id: 'firmas', label: '4. Validación y Firmas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-cream custom-scrollbar">
          
          {/* TAB 1: DATOS GENERALES Y ASOCIACIÓN */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              
              {/* Selector de Asociación */}
              <div className="bg-dark-3/60 p-4 rounded-xl border border-dark-4">
                <label className="text-xs font-black uppercase tracking-wider text-gold block mb-3">
                  Modalidad de Asociación
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEsObraExistente(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      esObraExistente
                        ? 'border-gold bg-gold/10 text-cream shadow-inner shadow-gold/5'
                        : 'border-dark-4 bg-dark-2 text-cream-muted hover:bg-dark-4'
                    }`}
                  >
                    <Building className={`w-5 h-5 ${esObraExistente ? 'text-gold' : 'text-cream-muted'}`} />
                    <div>
                      <div className="text-xs font-bold">Obra o Presupuesto Existente</div>
                      <div className="text-[10px] text-cream-muted">Vincula con obras_app o presupuestos activos</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEsObraExistente(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      !esObraExistente
                        ? 'border-gold bg-gold/10 text-cream shadow-inner shadow-gold/5'
                        : 'border-dark-4 bg-dark-2 text-cream-muted hover:bg-dark-4'
                    }`}
                  >
                    <User className={`w-5 h-5 ${!esObraExistente ? 'text-gold' : 'text-cream-muted'}`} />
                    <div>
                      <div className="text-xs font-bold">Cliente / Sitio Independiente</div>
                      <div className="text-[10px] text-cream-muted">Levantamiento preliminar sin obra previa registrada</div>
                    </div>
                  </button>
                </div>

                {/* Sub-selectores si es Obra Existente */}
                {esObraExistente && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dark-4">
                    <div>
                      <label className="block text-xs font-medium text-cream-muted mb-1">
                        Seleccionar de Obras Registradas
                      </label>
                      <select
                        value={obraNombre}
                        onChange={(e) => handleSelectObra(e.target.value)}
                        className="w-full bg-dark-2 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                      >
                        <option value="">-- Seleccionar Obra --</option>
                        {obrasList.map((o, idx) => (
                          <option key={idx} value={o.nombre}>
                            {o.nombre} ({o.cliente || 'Sin cliente'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-cream-muted mb-1">
                        O vincular con Presupuesto eSol
                      </label>
                      <select
                        value={presupuestoId}
                        onChange={(e) => handleSelectPresupuesto(e.target.value)}
                        className="w-full bg-dark-2 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                      >
                        <option value="">-- Seleccionar Presupuesto --</option>
                        {presupuestosList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {p.client_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Datos del Proyecto y Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Nombre del Sitio / Predio *
                  </label>
                  <input
                    type="text"
                    value={sitioNombre}
                    onChange={(e) => setSitioNombre(e.target.value)}
                    placeholder="Ej. Casa Bonaterra, Bodega Norte, Estructura POP"
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Nombre del Cliente / Solicitante *
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Ej. Roberto Franco, Gobierno del Estado, Grupo Borandra"
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                  {!esObraExistente && (
                    <label className="flex items-center gap-2 mt-2 text-[11px] text-cream-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={registrarClienteEnCrm}
                        onChange={(e) => setRegistrarClienteEnCrm(e.target.checked)}
                        className="rounded border-dark-4 bg-dark-2 text-gold focus:ring-gold"
                      />
                      Guardar automáticamente este contacto en el CRM de Clientes
                    </label>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Ubicación / Dirección Completa
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ubicacion}
                      onChange={(e) => setUbicacion(e.target.value)}
                      placeholder="Calle, No., Colonia, Municipio, Estado"
                      className="flex-1 bg-dark-3 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGetCoordinates}
                      className="px-3 py-2 bg-dark-4 hover:bg-gold/20 text-cream-muted hover:text-gold border border-dark-4 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                      title="Capturar coordenadas GPS actuales"
                    >
                      <MapPin className="w-3.5 h-3.5 text-gold" />
                      GPS
                    </button>
                  </div>
                  {(latitud !== undefined || longitud !== undefined) && (
                    <div className="text-[10px] text-gold mt-1">
                      Coordenadas capturadas: Lat {latitud?.toFixed(5)}, Lon {longitud?.toFixed(5)}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadatos de la Visita */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-dark-4">
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Tipo de Visita
                  </label>
                  <select
                    value={tipoVisita}
                    onChange={(e) => setTipoVisita(e.target.value as TipoVisita)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  >
                    {TIPOS_VISITA.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Fecha y Hora de la Visita
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaVisita}
                    onChange={(e) => setFechaVisita(e.target.value)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Estatus
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoVisita)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  >
                    <option value="completada">Completada</option>
                    <option value="borrador">Borrador</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="requiere_presupuesto">Requiere Cotización</option>
                  </select>
                </div>
              </div>

              {/* Personal y Contactos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dark-4">
                {/* Elaboró */}
                <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Quién Elaboró / Visitó (Técnico ESOL)
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-muted mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={elaboroNombre}
                      onChange={(e) => setElaboroNombre(e.target.value)}
                      placeholder="Nombre del técnico o ingeniero"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-muted mb-1">Cargo / Puesto</label>
                    <input
                      type="text"
                      value={elaboroCargo}
                      onChange={(e) => setElaboroCargo(e.target.value)}
                      placeholder="Ej. Ingeniero de Proyectos, Residente"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-muted mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={elaboroTelefono}
                      onChange={(e) => setElaboroTelefono(e.target.value)}
                      placeholder="Teléfono móvil"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                </div>

                {/* Recibió */}
                <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Quién Recibe / Atendió en Sitio
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-muted mb-1">Nombre de Contacto *</label>
                    <input
                      type="text"
                      value={recibeNombre}
                      onChange={(e) => setRecibeNombre(e.target.value)}
                      placeholder="Nombre de quien atendió la visita"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-muted mb-1">Cargo o Relación</label>
                    <input
                      type="text"
                      value={recibeCargo}
                      onChange={(e) => setRecibeCargo(e.target.value)}
                      placeholder="Ej. Propietario, Gerente, Encargado"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-cream-muted mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={recibeTelefono}
                      onChange={(e) => setRecibeTelefono(e.target.value)}
                      placeholder="Teléfono de contacto"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción básica */}
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                  Descripción General de la Visita *
                </label>
                <textarea
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describa el objetivo de la visita, las áreas inspeccionadas y las condiciones generales encontradas en el sitio..."
                  className="w-full bg-dark-3 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none resize-y"
                />
              </div>

            </div>
          )}

          {/* TAB 2: CONTENIDO TÉCNICO Y PARÁMETROS */}
          {activeTab === 'tecnico' && (
            <div className="space-y-6">
              
              {/* Puntos Clave / Hallazgos */}
              <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Puntos Clave y Hallazgos Técnicos
                    </h3>
                    <p className="text-[11px] text-cream-muted">
                      Agregue viñetas o notas destacadas que aparecerán como tarjetas en el PDF
                    </p>
                  </div>
                </div>

                {/* Form para agregar punto */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-dark-2 p-3 rounded-xl border border-dark-4">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={nuevoPuntoTitulo}
                      onChange={(e) => setNuevoPuntoTitulo(e.target.value)}
                      placeholder="Título (ej. Acometida trifásica 220V)"
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={nuevoPuntoDesc}
                      onChange={(e) => setNuevoPuntoDesc(e.target.value)}
                      placeholder="Detalle opcional (ej. Espacio disponible para ITM de 3x50A)"
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPuntoClave}
                      className="w-full h-full bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-lg px-3 py-1.5 text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de puntos agregados */}
                {puntosClave.length > 0 ? (
                  <div className="space-y-2">
                    {puntosClave.map((pt, idx) => (
                      <div
                        key={pt.id}
                        className="flex items-center justify-between p-3 bg-dark-2 rounded-xl border border-dark-4 hover:border-gold/30 transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-gold/10 text-gold text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-cream">{pt.titulo}</div>
                            {pt.descripcion && (
                              <div className="text-[11px] text-cream-muted mt-0.5">{pt.descripcion}</div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePuntoClave(pt.id)}
                          className="text-cream-muted hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-cream-muted/50 italic">
                    No se han registrado puntos clave todavía. Ingrese uno arriba.
                  </div>
                )}
              </div>

              {/* Recomendaciones y Siguientes Pasos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Observaciones y/o Recomendaciones técnicas
                  </label>
                  <textarea
                    rows={3}
                    value={recomendaciones}
                    onChange={(e) => setRecomendaciones(e.target.value)}
                    placeholder="Conclusiones del ingeniero, tipo de estructura sugerida, precauciones de instalación..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1 uppercase tracking-wider">
                    Siguientes Pasos Requeridos
                  </label>
                  <textarea
                    rows={3}
                    value={siguientesPasos}
                    onChange={(e) => setSiguientesPasos(e.target.value)}
                    placeholder="Acciones posteriores (ej. Elaborar propuesta en Cotizador, programar inicio de obra)..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none resize-y"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: EVIDENCIA FOTOGRÁFICA */}
          {activeTab === 'fotos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-dark-3/60 rounded-xl border border-dark-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Subir Evidencia Fotográfica
                  </h3>
                  <p className="text-xs text-cream-muted">
                    Las fotos se comprimen automáticamente en el dispositivo y se respaldan en Google Drive.
                  </p>
                </div>
                <label className="px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-gold/10">
                  <Camera className="w-4 h-4" />
                  Seleccionar Fotos / Tomar con Cámara
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoFiles}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>

              {isUploadingPhoto && (
                <div className="p-4 bg-gold/10 border border-gold/30 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" />
                  <div className="text-xs font-bold text-gold">{uploadProgressText}</div>
                </div>
              )}

              {/* Grid de fotos cargadas */}
              {fotografias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {fotografias.map((foto, idx) => (
                    <div
                      key={foto.id}
                      className="bg-dark-3 rounded-xl border border-dark-4 overflow-hidden flex flex-col group hover:border-gold/50 transition-all"
                    >
                      <div className="relative h-44 bg-dark-4 overflow-hidden flex items-center justify-center">
                        <img
                          src={foto.thumbnailUrl || foto.url}
                          alt={foto.descripcion}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(foto.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 hover:bg-red-500 text-cream flex items-center justify-center transition-all cursor-pointer shadow-md"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-gold">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="p-3 bg-dark-2 flex-1 flex flex-col justify-between">
                        <label className="text-[10px] font-bold text-cream-muted uppercase block mb-1">
                          Pie de Foto / Título:
                        </label>
                        <input
                          type="text"
                          value={foto.descripcion}
                          onChange={(e) => handleUpdatePhotoDesc(foto.id, e.target.value)}
                          placeholder="Ej. Medidor CFE, Tablero principal..."
                          className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-xs text-cream focus:border-gold outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-dark-4 rounded-2xl bg-dark-3/20">
                  <Camera className="w-10 h-10 text-cream-muted/40 mx-auto mb-3" />
                  <p className="text-xs font-bold text-cream-muted uppercase tracking-wider">
                    No se han subido fotografías todavía
                  </p>
                  <p className="text-[11px] text-cream-muted/60 mt-1">
                    Haga clic en el botón superior para agregar evidencia desde su equipo o cámara móvil
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FIRMAS Y VALIDACIÓN */}
          {activeTab === 'firmas' && (
            <div className="space-y-6">
              <div className="p-4 bg-dark-3/60 rounded-xl border border-dark-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gold mb-1">
                  Validación Técnica y Aprobación
                </h3>
                <p className="text-xs text-cream-muted">
                  Capture las firmas digitales en pantalla para imprimir en el formato oficial de PDF.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Firma Elaboró */}
                <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-gold uppercase tracking-wider block">
                      Firma: Elaboró / Residente Técnico
                    </span>
                    <span className="text-[11px] text-cream-muted">
                      {elaboroNombre} ({elaboroCargo})
                    </span>
                  </div>
                  <SignaturePad
                    label="Trazo de firma"
                    initialValue={firmaElaboro}
                    onChange={setFirmaElaboro}
                  />
                </div>

                {/* Firma Recibió */}
                <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-gold uppercase tracking-wider block">
                      Firma: Recibió / Cliente en Sitio
                    </span>
                    <span className="text-[11px] text-cream-muted">
                      {recibeNombre || 'Contacto en sitio'} ({recibeCargo})
                    </span>
                  </div>
                  <SignaturePad
                    label="Trazo de firma"
                    initialValue={firmaRecibe}
                    onChange={setFirmaRecibe}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-dark-4 bg-dark-1/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-cream-muted">
            Folio oficial: <strong className="text-gold font-mono">{folio}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-dark-4 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gold/40 bg-dark-2 hover:bg-dark-3 text-gold text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-gold/20"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Guardar y Generar PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
