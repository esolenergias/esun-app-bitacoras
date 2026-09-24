import React, { useEffect, useState } from 'react';
import { supabase } from '../../context/supabase';
import type { SolarProject, Proposal } from './esunTypes';
import InteractivePresentationModal from './InteractivePresentationModal';
import { verifyAndRegisterDevice } from './lib/proposalSecurity';
import { Loader2, ShieldAlert } from 'lucide-react';

interface EsunPropuestaViewerProps {
  projectId: string;
  proposalId: string;
}

class PresentationErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || 'Error inesperado' };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Presentation Rendering Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-2xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Hubo un detalle al procesar los datos de la propuesta</h2>
          <p className="text-slate-400 text-sm max-w-md mb-6">Estamos optimizando la visualización. Por favor presiona recargar.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Recargar Presentación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function EsunPropuestaViewer({ projectId, proposalId }: EsunPropuestaViewerProps) {
  const [project, setProject] = useState<SolarProject | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<{
    reason: string;
    clientName: string;
    devicesCount: number;
    maxDevices: number;
  } | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      setAccessDenied(null);

      try {
        const { data, error: sbError } = await supabase
          .from('esun_proyectos')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (!isMounted) return;

        if (sbError || !data) {
          setError('No pudimos encontrar este proyecto o ya no está disponible.');
          return;
        }

        const typedProject: SolarProject = {
          id: data.id,
          created_at: data.created_at,
          client_name: data.client_name || 'Cliente Solar',
          client_email: data.client_email,
          client_phone: data.client_phone,
          client_address: data.client_address,
          client_rfc: data.client_rfc,
          city: data.city,
          project_type: data.project_type || (data.load_profile ? 'off-grid' : 'grid-tie'),
          cfe_data: data.cfe_data,
          load_profile: data.load_profile,
          proposals: data.proposals || [],
          status: data.status || 'draft'
        };

        const foundProposal = typedProject.proposals.find(p => p.id === proposalId);
        if (!foundProposal) {
          setError('La propuesta solicitada no existe o fue eliminada.');
          return;
        }

        // --- VERIFICACIÓN DE SEGURIDAD POR DISPOSITIVO (MAX 2: INGENIERO + CLIENTE) ---
        const deviceCheck = await verifyAndRegisterDevice(projectId, proposalId, typedProject, foundProposal);
        
        if (!deviceCheck.authorized) {
          setAccessDenied({
            reason: 'device_limit_reached',
            clientName: typedProject.client_name,
            devicesCount: deviceCheck.devicesCount,
            maxDevices: deviceCheck.maxDevices
          });
          return;
        }

        setProject(typedProject);
        setProposal(foundProposal);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Error cargando propuesta técnica:", err);
        setError('Ocurrió un detalle de conexión al cargar la presentación.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [projectId, proposalId, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-1 flex flex-col items-center justify-center text-cream">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <p className="text-xl font-light">Cargando propuesta técnica...</p>
      </div>
    );
  }

  // --- PANTALLA DE ACCESO RESTRINGIDO (3ER DISPOSITIVO / REENVÍO BLOQUEADO) ---
  if (accessDenied) {
    const waText = encodeURIComponent(
      `Hola ESOL Energías, recibí una propuesta para ${accessDenied.clientName || 'un proyecto'} pero deseo solicitar mi propia cotización solar personalizada.`
    );
    const waUrl = `https://wa.me/523112343034?text=${waText}`;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Shield Icon with glowing badge */}
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <ShieldAlert className="w-10 h-10 text-[#FEE180]" />
          </div>

          <span className="px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FEE180] text-xs font-bold uppercase tracking-wider">
            Propuesta Confidencial
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 mb-2">
            Acceso Exclusivo al Titular
          </h1>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Esta propuesta técnica y económica ha sido vinculada exclusivamente a los dispositivos autorizados de <strong className="text-white">{accessDenied.clientName}</strong> y su asesor técnico de <strong className="text-white">ESOL Energías</strong>.
          </p>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Límite de {accessDenied.maxDevices} dispositivos alcanzado</span>
            </div>
            <p className="text-xs text-slate-400">
              Por políticas de privacidad y protección de datos, este enlace no puede visualizarse en dispositivos adicionales o reenvíos no autorizados.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              <span>Solicitar Mi Propuesta Personalizada</span>
            </a>

            <button
              onClick={() => setRetryCount(c => c + 1)}
              className="w-full py-3 px-6 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-2xl border border-slate-700/60 transition-all cursor-pointer text-xs"
            >
              Soy el Titular / Reintentar Verificación
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project || !proposal) {
    return (
      <div className="min-h-screen bg-dark-1 flex flex-col items-center justify-center text-cream p-4 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Problema de Conexión</h1>
        <p className="text-cream-muted max-w-md">{error}</p>
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => setRetryCount(c => c + 1)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-500 transition-colors shadow-md cursor-pointer"
          >
            Reintentar
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-slate-800 text-cream rounded-full font-bold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-dark-1">
      <PresentationErrorBoundary>
        <InteractivePresentationModal 
          project={project}
          proposal={proposal}
          isClientView={true}
          onClose={() => { window.location.href = '/'; }}
        />
      </PresentationErrorBoundary>
    </div>
  );
}
