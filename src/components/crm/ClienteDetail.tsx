import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Sun, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../context/supabase';

interface ClienteDetailProps {
  cliente: any;
  onBack: () => void;
  onNavigateTo?: (tab: string, payload?: any) => void;
}

export default function ClienteDetail({ cliente, onBack, onNavigateTo }: ClienteDetailProps) {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [esunQuotes, setEsunQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProyectos();
  }, [cliente.nombre_razon_social]);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      // 1. Fetch presupuestos eSol
      const { data: presData, error } = await supabase
        .from('presupuestos')
        .select('*')
        .ilike('client_name', cliente.nombre_razon_social);
      
      if (!error && presData) {
        setPresupuestos(presData);
      }

      // 2. Fetch Esun quotes from localStorage
      const storedEsun = localStorage.getItem('esun_quotes');
      if (storedEsun) {
        try {
          const parsed = JSON.parse(storedEsun);
          const relatedEsun = parsed.filter((q: any) => 
            q.client_name?.toLowerCase().trim() === cliente.nombre_razon_social.toLowerCase().trim()
          );
          setEsunQuotes(relatedEsun);
        } catch (e) {
          console.error('Error parsing esun quotes', e);
        }
      }

    } catch (err) {
      console.error('Error fetching client projects:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-dark-4 pb-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-light text-gold flex items-center gap-2">
            <User className="w-6 h-6" />
            {cliente.nombre_razon_social}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-cream-muted">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
              cliente.estatus === 'Prospecto' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              cliente.estatus === 'Cliente Activo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              'bg-dark-4 text-cream-muted'
            }`}>
              {cliente.estatus}
            </span>
            <span>Origen: {cliente.origen}</span>
            {cliente.email && <span>• {cliente.email}</span>}
            {cliente.telefono && <span>• {cliente.telefono}</span>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-cream-muted">
          Cargando proyectos del cliente...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PRESUPUESTOS ESOL */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-cream-muted flex items-center gap-2 border-b border-dark-4 pb-2">
              <FileText className="w-4 h-4 text-gold" />
              Presupuestos eSol ({presupuestos.length})
            </h3>
            
            {presupuestos.length === 0 ? (
              <p className="text-sm text-cream-dim bg-dark-2 p-4 rounded-xl border border-dark-4/50">
                No se encontraron presupuestos en eSol.
              </p>
            ) : (
              <div className="space-y-3">
                {presupuestos.map(p => (
                  <div key={p.id} className="bg-dark-2 border border-dark-4 p-4 rounded-xl hover:border-gold/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-cream">{p.name || 'Sin Título'}</div>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'draft' ? 'bg-dark-4 text-cream-muted' :
                        p.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-cream-muted flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-cream-muted flex items-center gap-2 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Producción: {p.produccion ? 'Activada' : 'Desactivada'}
                    </div>
                    <div className="mt-3 pt-3 border-t border-dark-4/50 flex justify-end gap-2">
                      {p.contrato_url ? (
                        <a 
                          href={p.contrato_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-wider text-green-400 hover:text-green-300 hover:bg-green-400/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-green-400/20 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Contrato
                        </a>
                      ) : (
                        <button 
                          disabled
                          className="text-[10px] font-bold uppercase tracking-wider text-cream-dim/50 cursor-not-allowed bg-dark-3/50 px-3 py-1.5 rounded-lg border border-dark-4 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 opacity-50" /> Sin Contrato
                        </button>
                      )}
                      <button 
                        onClick={() => onNavigateTo && onNavigateTo('cotizador', p.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold-light hover:bg-gold/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gold/20"
                      >
                        Abrir Presupuesto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ESUN SOLAR QUOTES */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-cream-muted flex items-center gap-2 border-b border-dark-4 pb-2">
              <Sun className="w-4 h-4 text-gold" />
              Cotizaciones Esun Solar ({esunQuotes.length})
            </h3>
            
            {esunQuotes.length === 0 ? (
              <p className="text-sm text-cream-dim bg-dark-2 p-4 rounded-xl border border-dark-4/50">
                No se encontraron cotizaciones en Esun Solar.
              </p>
            ) : (
              <div className="space-y-3">
                {esunQuotes.map(q => (
                  <div key={q.id} className="bg-dark-2 border border-dark-4 p-4 rounded-xl hover:border-gold/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-cream">
                        {q.system?.system_kWp?.toFixed(2)} kWp en {q.city || 'Ciudad Desconocida'}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-dark-4 text-cream-muted">
                        {q.status || 'Borrador'}
                      </span>
                    </div>
                    <div className="text-xs text-cream-muted flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(q.created_at).toLocaleDateString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-4/50">
                      <div>
                        <div className="text-[10px] text-cream-dim uppercase">Inversión</div>
                        <div className="text-sm font-bold text-cream">${q.financial?.totalInvestment?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-cream-dim uppercase">Ahorro 25 años</div>
                        <div className="text-sm font-bold text-green-400">${q.financial?.savings25Years?.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dark-4/50 flex justify-end gap-2">
                      <button 
                        onClick={() => onNavigateTo && onNavigateTo('esun', q.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold-light hover:bg-gold/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gold/20"
                      >
                        Cargar Esun Solar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
